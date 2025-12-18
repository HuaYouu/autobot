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
    let debounceTimers = {};

    // --- Helper Functions ---
    const logToCli = (message, type = 'system') => {
        const p = document.createElement('p');
        p.textContent = message;
        p.style.color = type === 'error' ? '#e06c75' : '#abb2bf';
        cliOutputDiv.appendChild(p);
        cliOutputDiv.scrollTop = cliOutputDiv.scrollHeight;
    };

    const renderBotList = () => {
        botListDiv.innerHTML = '';
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

        // --- Movement Control UI ---
        const movementControl = createMovementControl();
        moduleControlsDiv.appendChild(movementControl);

        // --- Master Toggle ---
        const isBotRunning = ['online', 'ready', 'connecting'].includes(state.botStatus);
        const botToggle = createModuleControl('bot-master-toggle', 'Bật / Tắt Bot', isBotRunning, null, (newState) => {
            window.api.send('toggle-bot', { botName: selectedBotName, state: newState });
        });
        moduleControlsDiv.appendChild(botToggle);

        // --- Module Toggles ---
        for (const moduleName in botConfig.modules) {
            const moduleConfig = botConfig.modules[moduleName];
            const isModuleEnabled = state.moduleStates[moduleName] || false;
            const hasOptions = moduleConfig.options && Object.keys(moduleConfig.options).length > 0;

            const control = createModuleControl(
                moduleName, `Chế độ ${moduleName}`, isModuleEnabled,
                hasOptions ? moduleConfig.options : null,
                (newState) => {
                    window.api.send('toggle-module', { botName: selectedBotName, moduleName, state: newState });
                }
            );
            moduleControlsDiv.appendChild(control);
        }
    };

    const createMovementControl = () => {
        const div = document.createElement('div');
        div.id = 'movement-control';
        div.innerHTML = `
            <label>Điều Khiển Di Chuyển</label>
            <div class="coords-inputs">
                <input type="number" id="coord-x" placeholder="X">
                <input type="number" id="coord-y" placeholder="Y">
                <input type="number" id="coord-z" placeholder="Z">
            </div>
            <button id="move-btn">Di Chuyển</button>
        `;

        const moveBtn = div.querySelector('#move-btn');
        moveBtn.addEventListener('click', () => {
            if (moveBtn.classList.contains('moving')) {
                // Stop movement
                window.api.send('stop-movement', { botName: selectedBotName });
            } else {
                // Start movement
                const x = parseFloat(document.getElementById('coord-x').value);
                const y = parseFloat(document.getElementById('coord-y').value);
                const z = parseFloat(document.getElementById('coord-z').value);
                if (isNaN(x) || isNaN(y) || isNaN(z)) {
                    logToCli('Lỗi: Tọa độ không hợp lệ.', 'error');
                    return;
                }
                window.api.send('move-to-coordinates', { botName: selectedBotName, coords: { x, y, z } });
            }
        });

        return div;
    };

    const createModuleControl = (id, label, isEnabled, options, onToggle) => {
        const controlDiv = document.createElement('div');
        controlDiv.className = 'module-control';
        const header = document.createElement('div');
        header.className = 'module-control-header';
        const labelSpan = document.createElement('span');
        labelSpan.className = 'module-label';
        labelSpan.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${label}`;
        header.appendChild(labelSpan);
        if (options) {
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'settings-btn';
            settingsBtn.innerHTML = '<i class="fa-solid fa-caret-down"></i>';
            header.appendChild(settingsBtn);
        }
        const switchLabel = document.createElement('label');
        switchLabel.className = 'switch';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = isEnabled;
        checkbox.id = `toggle-${selectedBotName}-${id}`;
        checkbox.addEventListener('change', (e) => onToggle(e.target.checked));
        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(document.createElement('span')).className = 'slider round';
        header.appendChild(switchLabel);
        controlDiv.appendChild(header);
        if (options) {
            const content = document.createElement('div');
            content.className = 'collapsible-content';
            for(const key in options) {
                content.appendChild(createOptionControl(id, key, options[key]));
            }
            controlDiv.appendChild(content);
            header.querySelector('.settings-btn').addEventListener('click', () => {
                content.classList.toggle('show');
                header.querySelector('.settings-btn').classList.toggle('open');
            });
        }
        return controlDiv;
    };

    const createOptionControl = (moduleName, key, value) => {
        const div = document.createElement('div');
        div.className = 'option-control';
        const label = document.createElement('label');
        label.textContent = key;
        div.appendChild(label);
        let input;
        if (key === 'mode' && moduleName === 'combatManager') {
            input = document.createElement('select');
            ['guardian', 'aggressive', 'patrol'].forEach(mode => {
                const option = document.createElement('option');
                option.value = mode;
                option.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
                if (mode === value) option.selected = true;
                input.appendChild(option);
            });
        } else if (Array.isArray(value)) {
            input = document.createElement('textarea');
            input.value = value.join('\n');
        } else {
            input = document.createElement('input');
            input.type = typeof value === 'number' ? 'number' : 'text';
            input.value = value;
        }
        input.addEventListener('input', () => {
            clearTimeout(debounceTimers[key]);
            debounceTimers[key] = setTimeout(() => {
                let newValue = input.value;
                if (Array.isArray(value)) newValue = input.value.split('\n').filter(v => v);
                if (typeof value === 'number') newValue = parseFloat(input.value);
                window.api.send('update-module-options', {
                    botName: selectedBotName,
                    moduleName,
                    newOptions: { [key]: newValue }
                });
            }, 500);
        });
        div.appendChild(input);
        return div;
    };

    const updateBotStatus = (botName, status) => {
        const botItem = botListDiv.querySelector(`.bot-item[data-bot-name="${botName}"]`);
        if (!botItem) return;
        const statusIcon = botItem.querySelector('.status-icon');
        const statusLabel = botItem.querySelector('.status-label');
        if (botName === selectedBotName) {
            const masterToggle = document.getElementById(`toggle-${botName}-bot-master-toggle`);
            if (masterToggle) {
                masterToggle.checked = ['online', 'ready', 'connecting'].includes(status);
            }
        }
        statusIcon.className = 'status-icon';
        statusLabel.className = 'status-label';
        let iconClass, labelClass, labelText;
        switch(status) {
            case 'online': case 'ready': iconClass = 'running'; labelClass = 'running'; labelText = 'Đang Chạy'; break;
            case 'connecting': iconClass = 'waiting'; labelClass = 'waiting'; labelText = 'Kết nối...'; break;
            default: iconClass = 'disconnected'; labelClass = 'disconnected'; labelText = 'Đã Tắt';
        }
        statusIcon.classList.add(iconClass);
        statusLabel.classList.add(labelClass);
        statusLabel.textContent = labelText;
        statusIcon.innerHTML = `<i class="fa-solid ${iconClass === 'running' ? 'fa-check' : (iconClass === 'waiting' ? 'fa-clock' : 'fa-xmark')}"></i>`;
    };

    const handleMovementUpdate = ({ botName, event }) => {
        if (botName !== selectedBotName) return;
        const moveBtn = document.getElementById('move-btn');
        if (!moveBtn) return;

        switch(event) {
            case 'movement_started':
                moveBtn.textContent = 'Dừng';
                moveBtn.classList.add('moving');
                moveBtn.disabled = false;
                break;
            case 'movement_stopped':
            case 'movement_reached':
            case 'movement_failed':
                moveBtn.textContent = 'Di Chuyển';
                moveBtn.classList.remove('moving');
                moveBtn.disabled = false;
                break;
        }
    };

    const handleSendCommand = () => {
        const command = cliInputField.value.trim();
        if (!command) return;
        if (!selectedBotName) { logToCli('Lỗi: Vui lòng chọn một bot trước khi gửi lệnh.', 'error'); return; }
        window.api.send('send-command', { botName: selectedBotName, command });
        cliInputField.value = '';
    };

    cliSendBtn.addEventListener('click', handleSendCommand);
    cliInputField.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendCommand());

    window.api.on('log-message', logToCli);
    window.api.on('bot-status-update', ({ botName, status }) => updateBotStatus(botName, status));
    window.api.on('bot-movement-update', handleMovementUpdate);

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
