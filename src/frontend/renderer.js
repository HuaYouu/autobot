document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const botListDiv = document.getElementById('bot-list');
    const selectedBotNameSpan = document.getElementById('selected-bot-name');
    const moduleControlsDiv = document.getElementById('module-controls');
    const cliOutputDiv = document.getElementById('cli-output');
    const cliInputField = document.getElementById('cli-input-field');
    const cliSendBtn = document.getElementById('cli-send-btn');

    // --- State ---
    let botConfigs = null;
    let selectedBotName = null;

    // --- Helper Functions ---
    const logToCli = (message, type = 'system') => {
        const p = document.createElement('p');
        p.textContent = message;
        p.style.color = type === 'error' ? '#e06c75' : '#abb2bf';
        cliOutputDiv.appendChild(p);
        cliOutputDiv.scrollTop = cliOutputDiv.scrollHeight;
    };

    const renderBotList = () => {
        botListDiv.innerHTML = ''; // Clear current list
        if (!botConfigs || !botConfigs.bots) {
            logToCli('Không tìm thấy cấu hình bot trong settings.json.', 'error');
            return;
        }

        for (const botName in botConfigs.bots) {
            const botItem = document.createElement('div');
            botItem.className = 'bot-item';
            botItem.dataset.botName = botName;
            botItem.innerHTML = `
                <span class="status-icon disconnected"><i class="fa-solid fa-xmark"></i></span>
                <span class="bot-name">${botName}</span>
                <span class="status-label disconnected">Tắt</span>
            `;
            botItem.addEventListener('click', () => selectBot(botName));
            botListDiv.appendChild(botItem);
        }
    };

    const selectBot = async (botName) => {
        if (selectedBotName === botName) return;

        selectedBotName = botName;
        selectedBotNameSpan.textContent = botName;

        document.querySelectorAll('.bot-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.botName === botName);
        });

        logToCli(`Đã chọn bot: ${botName}. Đang lấy trạng thái...`);
        try {
            const state = await window.api.invoke('get-bot-state', botName);
            renderModuleControls(state);
            logToCli(`Đã tải trạng thái của bot ${botName}.`);
        } catch (error) {
            logToCli(`Lỗi khi lấy trạng thái của bot ${botName}: ${error.message}`, 'error');
        }
    };

    const renderModuleControls = (state) => {
        moduleControlsDiv.innerHTML = '';
        if (!selectedBotName || !botConfigs.bots[selectedBotName] || !state) return;

        const botConfig = botConfigs.bots[selectedBotName];

        // Master toggle for the bot itself, based on its live status
        const isBotRunning = state.botStatus === 'online' || state.botStatus === 'ready' || state.botStatus === 'connecting';
        const botToggle = createModuleControl('bot-master-toggle', 'Bật / Tắt Bot', isBotRunning, (newState) => {
            window.api.send('toggle-bot', { botName: selectedBotName, state: newState });
        });
        moduleControlsDiv.appendChild(botToggle);

        // Render toggles for each module, based on its live status
        for (const moduleName in botConfig.modules) {
             const isModuleEnabled = state.moduleStates[moduleName] || false;
             const control = createModuleControl(moduleName, `Chế độ ${moduleName}`, isModuleEnabled, (newState) => {
                window.api.send('toggle-module', { botName: selectedBotName, moduleName, state: newState });
             });
             moduleControlsDiv.appendChild(control);
        }
    };

    const createModuleControl = (id, label, isChecked, onChange) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'module-control';

        const labelSpan = document.createElement('span');
        labelSpan.textContent = label;

        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isChecked;
        checkbox.id = `toggle-${selectedBotName}-${id}`;
        checkbox.addEventListener('change', (e) => onChange(e.target.checked));

        const sliderSpan = document.createElement('span');
        sliderSpan.className = 'slider round';

        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(sliderSpan);
        controlDiv.appendChild(labelSpan);
        controlDiv.appendChild(switchLabel);

        return controlDiv;
    };

    const updateBotStatus = (botName, status) => {
        const botItem = botListDiv.querySelector(`.bot-item[data-bot-name="${botName}"]`);
        if (!botItem) return;

        const statusIcon = botItem.querySelector('.status-icon');
        const statusLabel = botItem.querySelector('.status-label');

        // Only update the master toggle if this bot is currently selected
        if (botName === selectedBotName) {
            const masterToggle = document.getElementById(`toggle-${botName}-bot-master-toggle`);
            if (masterToggle) {
                masterToggle.checked = (status === 'online' || status === 'ready' || status === 'connecting');
            }
        }

        statusIcon.className = 'status-icon';
        statusLabel.className = 'status-label';

        let iconClass, labelClass, labelText;
        switch(status) {
            case 'online':
            case 'ready':
                iconClass = 'running'; labelClass = 'running'; labelText = 'Đang Chạy';
                break;
            case 'connecting':
                 iconClass = 'waiting'; labelClass = 'waiting'; labelText = 'Kết nối...';
                break;
            case 'stopped':
            case 'disconnected':
            default:
                iconClass = 'disconnected'; labelClass = 'disconnected'; labelText = 'Đã Tắt';
        }

        statusIcon.classList.add(iconClass);
        statusLabel.classList.add(labelClass);
        statusLabel.textContent = labelText;
        statusIcon.innerHTML = `<i class="fa-solid ${iconClass === 'running' ? 'fa-check' : (iconClass === 'waiting' ? 'fa-clock' : 'fa-xmark')}"></i>`;
    };

    // --- Event Listeners ---
    const handleSendCommand = () => {
        const command = cliInputField.value.trim();
        if (!command) return;
        if (!selectedBotName) {
            logToCli('Lỗi: Vui lòng chọn một bot trước khi gửi lệnh.', 'error');
            return;
        }
        window.api.send('send-command', { botName: selectedBotName, command });
        cliInputField.value = '';
    };

    cliSendBtn.addEventListener('click', handleSendCommand);
    cliInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendCommand();
    });

    // --- IPC Listeners ---
    window.api.on('log-message', (message) => logToCli(message));
    window.api.on('bot-status-update', ({ botName, status }) => {
        updateBotStatus(botName, status);
    });

    // --- Initialization ---
    const initialize = async () => {
        logToCli('Đang tải cấu hình bot...');
        botConfigs = await window.api.invoke('get-bot-configs');
        if (botConfigs) {
            logToCli('Tải cấu hình thành công.');
            renderBotList();
        } else {
            logToCli('Không thể tải file settings.json. Vui lòng kiểm tra.', 'error');
        }
    };

    initialize();
});
