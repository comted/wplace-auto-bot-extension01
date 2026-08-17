// WPlace AutoBOT のコンテンツスクリプト - ページ内 UI を作成します

// wplace.live 上でのみ動作させる
if (window.location.hostname === 'wplace.live') {

    // 制御変数
    let autobotButton = null;
    let buttonRemoved = false;
    let buttonHiddenByModal = false;
    let currentScript = null;

    // 利用可能なスクリプト設定 - デフォルトで実行するスクリプト
    const DEFAULT_SCRIPT = 'Script-manager.js'; // スクリプトマネージャ ランチャー

    // モーダルが開いているか確認
    function isAnyModalOpen() {
        const modals = document.querySelectorAll('dialog.modal[open], dialog[open]');
        return modals.length > 0;
    }

    // モーダルに応じてボタンの表示/非表示を制御
    function handleButtonVisibility() {
        if (!autobotButton || buttonRemoved) return;

        if (isAnyModalOpen()) {
            if (!buttonHiddenByModal) {
                buttonHiddenByModal = true;
                autobotButton.style.transition = 'all 0.3s ease-out';
                autobotButton.style.opacity = '0';
                autobotButton.style.transform = 'scale(0.8)';
                autobotButton.style.pointerEvents = 'none';
            }
        } else {
            if (buttonHiddenByModal) {
                buttonHiddenByModal = false;
                autobotButton.style.transition = 'all 0.3s ease-in';
                autobotButton.style.opacity = '1';
                autobotButton.style.transform = 'scale(1)';
                autobotButton.style.pointerEvents = 'auto';
            }
        }
    }

    // アニメーション付きでボタンを削除
    function removeButtonWithAnimation() {
        buttonRemoved = true;

        if (autobotButton && autobotButton.parentNode) {
            autobotButton.style.transition = 'all 0.5s ease-out';
            autobotButton.style.opacity = '0';
            autobotButton.style.transform = 'scale(0.5) translateY(-10px)';

            setTimeout(() => {
                if (autobotButton && autobotButton.parentNode) {
                    autobotButton.parentNode.removeChild(autobotButton);
                    autobotButton = null;
                }
            }, 500);
        }
    }

    // スクリプト実行処理
    async function executeScript(scriptName) {
        if (!autobotButton || currentScript) return;

        try {
            // ボタンを読み込み中表示に変更
            autobotButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5 animate-spin">
                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
                </svg>
            `;
            autobotButton.style.opacity = '0.7';
            autobotButton.disabled = true;
            currentScript = scriptName;

            // background にスクリプト実行を依頼
            const response = await chrome.runtime.sendMessage({
                action: 'executeScript',
                scriptName: scriptName
            });

            if (response && response.success) {
                // 成功表示
                autobotButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                        <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z"/>
                    </svg>
                `;
                autobotButton.style.background = '#4CAF50';
                autobotButton.disabled = false;
                autobotButton.title = `${scriptName} を正常に実行しました`;

                // 2秒後にリセット（削除しない）
                setTimeout(() => {
                    resetButton();
                }, 2000);
            } else {
                throw new Error(response?.error || 'Failed to execute script');
            }

        } catch (error) {
            console.error('スクリプト実行エラー:', error);
            currentScript = null;

            // エラー表示
            if (autobotButton) {
                autobotButton.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                        <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z"/>
                    </svg>
                `;
                autobotButton.style.opacity = '1';
                autobotButton.style.background = '#f44336';
                autobotButton.title = `エラー: ${error.message} - クリックで再試行`;

                setTimeout(() => {
                    resetButton();
                }, 3000);
            }
        }
    }

    // Script Manager からの実行要求を受け取る
    window.addEventListener('autobot-execute-script', async (event) => {
        const { scriptName } = event.detail;
        console.log(`%c📡 Script Manager から実行要求を受信しました: ${scriptName}`, 'color: #00ff41; font-weight: bold;');

        // content script の Chrome API を使って実行
        try {
            const response = await chrome.runtime.sendMessage({
                action: 'executeScript',
                scriptName: scriptName
            });

            if (response && response.success) {
                console.log(`%c✅ ${scriptName} を content script 経由で正常に実行しました`, 'color: #39ff14; font-weight: bold;');
            } else {
                console.error(`%c❌ スクリプト実行に失敗しました:`, 'color: #ff073a; font-weight: bold;', response?.error);
            }
        } catch (error) {
            console.error(`%c❌ スクリプト実行中にエラーが発生しました:`, 'color: #ff073a; font-weight: bold;', error);
        }
    });

    // ボタンを初期状態に戻す
    function resetButton() {
        if (autobotButton) {
            autobotButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                    <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V1[...]"/>
                </svg>
            `;
            autobotButton.style.background = '';
            autobotButton.title = `AutoBot - クリックで ${DEFAULT_SCRIPT} を実行`;
            autobotButton.disabled = false;
            currentScript = null;
        }
    }

    // スクリプトメニュー機能は削除 - ボタンはデフォルトスクリプトを直接実行します

    // AutoBot ボタンを作成
    function createAutoButton() {
        if (buttonRemoved) return;

        const menuContainer = document.querySelector('.absolute.right-2.top-2.z-30 .flex.flex-col.gap-3.items-center');

        if (!menuContainer) {
            setTimeout(createAutoButton, 1000);
            return;
        }

        if (document.getElementById('wplace-autobot-btn')) {
            return;
        }

        autobotButton = document.createElement('button');
        autobotButton.id = 'wplace-autobot-btn';
        autobotButton.className = 'btn btn-square shadow-md';
        autobotButton.title = `AutoBot - クリックで ${DEFAULT_SCRIPT} を実行`;
        autobotButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
                <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,[...]"/>
            </svg>
        `;

        autobotButton.style.cssText = `
            transition: all 0.2s ease;
        `;

        // メニューではなく直接実行
        autobotButton.addEventListener('click', () => {
            executeScript(DEFAULT_SCRIPT);
        });

        // コンテナの末尾に挿入
        menuContainer.appendChild(autobotButton);

        setTimeout(() => handleButtonVisibility(), 100);

        console.log('AutoBot ボタンをメニューに追加しました');
    }

    // モーダル監視のセットアップ
    function setupModalObservers() {
        const modalAttributeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                    handleButtonVisibility();
                }
            });
        });

        const domObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.matches && node.matches('dialog.modal, dialog')) {
                                modalAttributeObserver.observe(node, {
                                    attributes: true,
                                    attributeFilter: ['open']
                                });
                                handleButtonVisibility();
                            }

                            const nestedModals = node.querySelectorAll ?
                                node.querySelectorAll('dialog.modal, dialog') : [];
                            nestedModals.forEach((modal) => {
                                modalAttributeObserver.observe(modal, {
                                    attributes: true,
{