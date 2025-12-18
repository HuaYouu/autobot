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

    // --- UI Rendering ---
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

        moduleControlsDiv.appendChild(createMovementControl());

        const isBotRunning = ['online', 'ready', 'connecting'].includes(state.botStatus);
        moduleControlsDiv.appendChild(createModuleControl('bot-master-toggle', 'Bật / Tắt Bot', isBotRunning, null, (newState) => {
            window.api.send('toggle-bot', { botName: selectedBotName, state: newState });
        }));

        for (const moduleName in botConfig.modules) {
            const moduleConfig = botConfig.modules[moduleName];
            const isModuleEnabled = state.moduleStates[moduleName] || false;
            const hasOptions = moduleConfig.options && Object.keys(moduleConfig.options).length > 0;
            moduleControlsDiv.appendChild(createModuleControl(
                moduleName, `Chế độ ${moduleName}`, isModuleEnabled,
                hasOptions ? moduleConfig.options : null,
                (newState) => {
                    window.api.send('toggle-module', { botName: selectedBotName, moduleName, state: newState });
                }
            ));
        }
    };

    const createMovementControl = () => {
        const div = document.createElement('div');
        div.id = 'movement-control';
        div.innerHTML = `<label>Điều Khiển Di Chuyển</label>
            <div class="coords-inputs">
                <input type="number" id="coord-x" placeholder="X">
                <input type="number" id="coord-y" placeholder="Y">
                <input type="number" id="coord-z" placeholder="Z">
            </div>
            <button id="move-btn">Di Chuyển</button>`;
        const moveBtn = div.querySelector('#move-btn');
        moveBtn.addEventListener('click', () => {
            if (moveBtn.classList.contains('moving')) {
                window.api.send('stop-movement', { botName: selectedBotName });
            } else {
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
            content.id = `options-${id}`;

            // --- Build CombatManager specific layout ---
            if (id === 'combatManager') {
                const row1 = document.createElement('div');
                row1.className = 'option-row';
                row1.appendChild(createOptionControl(id, 'mode', options.mode, options));
                row1.appendChild(createOptionControl(id, 'retreatHealthLevel', options.retreatHealthLevel, options));
                content.appendChild(row1);

                content.appendChild(createOptionControl(id, 'guardianTarget', options.guardianTarget, options));
                content.appendChild(createOptionControl(id, 'patrolArea', options.patrolArea, options));
                content.appendChild(createOptionControl(id, 'blacklist', options.blacklist, options));
                content.appendChild(createOptionControl(id, 'whitelist', options.whitelist, options));
                content.appendChild(createOptionControl(id, 'submodules', options.submodules, options));
            } else { // Generic layout for other modules
                for(const key in options) {
                    content.appendChild(createOptionControl(id, key, options[key], options));
                }
            }

            controlDiv.appendChild(content);
            header.querySelector('.settings-btn').addEventListener('click', () => {
                content.classList.toggle('show');
                header.querySelector('.settings-btn').classList.toggle('open');
            });
        }
        return controlDiv;
    };

    const createOptionControl = (moduleName, key, value, allOptions) => {
        const div = document.createElement('div');
        div.className = 'option-control';
        div.id = `option-${moduleName}-${key}`;

        let controlHtml = `<label>${key}</label>`;

        // --- Custom UI components based on key and data type ---
        if (key === 'mode') {
            const modes = ['guardian', 'aggressive', 'patrol'];
            controlHtml += `<select data-key="${key}">${modes.map(m => `<option value="${m}" ${m === value ? 'selected' : ''}>${m}</option>`).join('')}</select>`;
            div.innerHTML = controlHtml;
            div.querySelector('select').addEventListener('change', (e) => {
                handleOptionChange(moduleName, key, e.target.value);
                updateConditionalControls(moduleName, e.target.value);
            });
        } else if (key === 'patrolArea') {
            controlHtml += `<div class="patrol-area-grid">
                ${[...Array(4)].map((_, i) => `
                    <input type="number" placeholder="P${i+1} X" data-index="${i}" data-coord="x" value="${value[i]?.x || ''}">
                    <input type="number" placeholder="P${i+1} Y" data-index="${i}" data-coord="y" value="${value[i]?.y || ''}">
                    <input type="number" placeholder="P${i+1} Z" data-index="${i}" data-coord="z" value="${value[i]?.z || ''}">
                `).join('')}
            </div>`;
            div.innerHTML = controlHtml;
            div.querySelector('.patrol-area-grid').addEventListener('input', (e) => {
                const inputs = Array.from(div.querySelectorAll('input'));
                const newValue = [...Array(4)].map((_, i) => ({
                    x: parseFloat(inputs.find(inp => inp.dataset.index == i && inp.dataset.coord === 'x').value) || 0,
                    y: parseFloat(inputs.find(inp => inp.dataset.index == i && inp.dataset.coord === 'y').value) || 0,
                    z: parseFloat(inputs.find(inp => inp.dataset.index == i && inp.dataset.coord === 'z').value) || 0,
                }));
                handleOptionChange(moduleName, key, newValue, true); // Use debounce for arrays
            });
        } else if (key === 'blacklist' || key === 'whitelist') {
            div.innerHTML = `<label>${key}</label><div class="tag-container" data-key="${key}">${value.map(tag => `<span class="tag">${tag}<span class="tag-close-btn">&times;</span></span>`).join('')}<input class="tag-input" placeholder="Add..."></div>`;
            const tagContainer = div.querySelector('.tag-container');
            const input = div.querySelector('.tag-input');
            tagContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-close-btn')) {
                    const tagText = e.target.parentElement.textContent.slice(0, -1);
                    const currentTags = Array.from(tagContainer.querySelectorAll('.tag')).map(t => t.textContent.slice(0, -1));
                    handleOptionChange(moduleName, key, currentTags.filter(t => t !== tagText));
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && input.value) {
                    const currentTags = Array.from(tagContainer.querySelectorAll('.tag')).map(t => t.textContent.slice(0, -1));
                    handleOptionChange(moduleName, key, [...currentTags, input.value]);
                }
            });
        } else if (key === 'submodules') {
             controlHtml += `<div>${Object.keys(value).map(sm => `
                <div class="module-control-header" style="background: #282c34; padding: 5px; border-radius: 4px; margin-bottom: 5px;">
                    <span class="module-label">${sm}</span>
                    <label class="switch"><input type="checkbox" data-key="${sm}" ${value[sm] ? 'checked' : ''}><span class="slider round"></span></label>
                </div>
            `).join('')}</div>`;
            div.innerHTML = controlHtml;
            div.querySelector('div').addEventListener('change', (e) => {
                const submodules = { ...allOptions.submodules, [e.target.dataset.key]: e.target.checked };
                handleOptionChange(moduleName, key, submodules);
            });
        } else { // Generic text/number input
            controlHtml += `<input type="${typeof value === 'number' ? 'number' : 'text'}" data-key="${key}" value="${value}">`;
            div.innerHTML = controlHtml;
            div.querySelector('input').addEventListener('input', (e) => {
                const newValue = typeof value === 'number' ? parseFloat(e.target.value) : e.target.value;
                handleOptionChange(moduleName, key, newValue, true);
            });
        }

        // Initial state for conditional controls
        if(allOptions && allOptions.mode) {
            updateConditionalControls(moduleName, allOptions.mode);
        }

        return div;
    };

    const updateConditionalControls = (moduleName, mode) => {
        const parent = document.getElementById(`options-${moduleName}`);
        if (!parent) return;
        const guardianTarget = parent.querySelector(`#option-${moduleName}-guardianTarget`);
        const patrolArea = parent.querySelector(`#option-${moduleName}-patrolArea`);

        if (guardianTarget) guardianTarget.classList.toggle('hidden', mode !== 'guardian');
        if (patrolArea) patrolArea.classList.toggle('hidden', mode !== 'patrol');
    };

    const handleOptionChange = (moduleName, key, value, useDebounce = false) => {
        const updatePayload = { botName: selectedBotName, moduleName, newOptions: { [key]: value } };

        if (useDebounce) {
            clearTimeout(debounceTimers[key]);
            debounceTimers[key] = setTimeout(() => {
                window.api.send('update-module-options', updatePayload);
            }, 500);
        } else {
            window.api.send('update-module-options', updatePayload);
            // Re-render controls to reflect immediate changes (like adding a tag)
            selectBot(selectedBotName);
        }
    };

    // --- Event Listeners & Initialization ---
    const updateBotStatus = (botName, status) => {
        const botItem = botListDiv.querySelector(`.bot-item[data-bot-name="${botName}"]`);
        if (!botItem) return;
        const statusIcon = botItem.querySelector('.status-icon');
        const statusLabel = botItem.querySelector('.status-label');
        if (botName === selectedBotName) {
            const masterToggle = document.getElementById(`toggle-${botName}-bot-master-toggle`);
            if (masterToggle) masterToggle.checked = ['online', 'ready', 'connecting'].includes(status);
        }
        statusIcon.className = 'status-icon';
        statusLabel.className = 'status-label';
        let iCls, lCls, lTxt;
        switch(status) {
            case 'online': case 'ready': iCls = 'running'; lCls = 'running'; lTxt = 'Đang Chạy'; break;
            case 'connecting': iCls = 'waiting'; lCls = 'waiting'; lTxt = 'Kết nối...'; break;
            default: iCls = 'disconnected'; lCls = 'disconnected'; lTxt = 'Đã Tắt';
        }
        statusIcon.classList.add(iCls); statusLabel.classList.add(lCls); statusLabel.textContent = lTxt;
        statusIcon.innerHTML = `<i class="fa-solid ${iCls==='running'?'fa-check':(iCls==='waiting'?'fa-clock':'fa-xmark')}"></i>`;
    };

    const handleMovementUpdate = ({ botName, event }) => {
        if (botName !== selectedBotName) return;
        const moveBtn = document.getElementById('move-btn');
        if (!moveBtn) return;
        switch(event) {
            case 'movement_started': moveBtn.textContent = 'Dừng'; moveBtn.classList.add('moving'); moveBtn.disabled = false; break;
            case 'movement_stopped': case 'movement_reached': case 'movement_failed':
                moveBtn.textContent = 'Di Chuyển'; moveBtn.classList.remove('moving'); moveBtn.disabled = false; break;
        }
    };

    const handleSendCommand = () => {
        const command = cliInputField.value.trim();
        if (!command || !selectedBotName) return;
        window.api.send('send-command', { botName: selectedBotName, command });
        cliInputField.value = '';
    };

    const initialize = async () => {
        cliSendBtn.addEventListener('click', handleSendCommand);
        cliInputField.addEventListener('keypress', (e) => e.key === 'Enter' && handleSendCommand());
        window.api.on('log-message', logToCli);
        window.api.on('bot-status-update', ({ botName, status }) => updateBotStatus(botName, status));
        window.api.on('bot-movement-update', handleMovementUpdate);

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
