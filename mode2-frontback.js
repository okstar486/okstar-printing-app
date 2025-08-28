// Mode 2: 앞판+뒷판 컴포넌트
(function() {
    'use strict';
    
    // Mode 2 상태 관리
    const mode2State = {
        front: { 
            tshirts: [], 
            design: null, 
            currentIndex: 0,
            position: { x: 300, y: 200 },
            scale: 0.3
        },
        back: { 
            tshirts: [], 
            design: null, 
            currentIndex: 0,
            position: { x: 300, y: 360 },
            scale: 1.0
        }
    };
    
    // HTML 템플릿
    const mode2HTML = `
        <div class="upload-grid">
            <div class="upload-section">
                <div class="section-title" style="color: #3b82f6;">
                    👔 앞판 (Front)
                </div>
                <div class="upload-row">
                    <div>
                        <input type="file" id="fbFrontTshirtInput" accept="image/*" multiple>
                        <label for="fbFrontTshirtInput" class="upload-label" id="fbFrontTshirtLabel">
                            📁 앞판 무지티<br>
                            <small>여러 개 선택 가능</small>
                        </label>
                        <div class="file-list" id="fbFrontTshirtList"></div>
                    </div>
                    <div>
                        <input type="file" id="fbFrontDesignInput" accept="image/*">
                        <label for="fbFrontDesignInput" class="upload-label" id="fbFrontDesignLabel">
                            🎨 앞판 디자인<br>
                            <small>가슴 로고용</small>
                        </label>
                    </div>
                </div>
            </div>

            <div class="upload-section">
                <div class="section-title" style="color: #8b5cf6;">
                    🎨 뒷판 (Back)
                </div>
                <div class="upload-row">
                    <div>
                        <input type="file" id="fbBackTshirtInput" accept="image/*" multiple>
                        <label for="fbBackTshirtInput" class="upload-label" id="fbBackTshirtLabel">
                            📁 뒷판 무지티<br>
                            <small>여러 개 선택 가능</small>
                        </label>
                        <div class="file-list" id="fbBackTshirtList"></div>
                    </div>
                    <div>
                        <input type="file" id="fbBackDesignInput" accept="image/*">
                        <label for="fbBackDesignInput" class="upload-label" id="fbBackDesignLabel">
                            🎨 뒷판 디자인<br>
                            <small>등 전체용</small>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-navigation" id="fbTabs">
            <span style="color: #94a3b8; padding: 6px;">앞뒤 티셔츠를 업로드하면 색상별 탭이 표시됩니다</span>
        </div>

        <div class="canvas-container">
            <div class="canvas-section">
                <div class="canvas-title" style="color: #3b82f6;">👔 앞판 미리보기</div>
                <canvas id="fbFrontCanvas"></canvas>
                <div class="controls">
                    <div class="control-group">
                        <span class="control-label">크기:</span>
                        <input type="range" id="fbFrontScale" min="5" max="200" value="30">
                        <span class="scale-value" id="fbFrontScaleValue">30%</span>
                    </div>
                </div>
            </div>

            <div class="canvas-section">
                <div class="canvas-title" style="color: #8b5cf6;">🎨 뒷판 미리보기</div>
                <canvas id="fbBackCanvas"></canvas>
                <div class="controls">
                    <div class="control-group">
                        <span class="control-label">크기:</span>
                        <input type="range" id="fbBackScale" min="5" max="200" value="100">
                        <span class="scale-value" id="fbBackScaleValue">100%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 초기화 함수
    function initMode2() {
        const container = document.getElementById('frontbackMode');
        container.innerHTML = mode2HTML;
        
        const fbFrontCanvas = document.getElementById('fbFrontCanvas');
        const fbBackCanvas = document.getElementById('fbBackCanvas');
        const fbFrontCtx = fbFrontCanvas.getContext('2d');
        const fbBackCtx = fbBackCanvas.getContext('2d');
        
        fbFrontCanvas.width = 600;
        fbFrontCanvas.height = 720;
        fbBackCanvas.width = 600;
        fbBackCanvas.height = 720;
        
        // 이벤트 리스너 설정
        setupMode2Events();
        
        // 드래그 설정
        setupFBDrag(fbFrontCanvas, 'front');
        setupFBDrag(fbBackCanvas, 'back');
        
        // appState에 연결
        window.appState.modes.frontback = mode2State;
        
        // 초기 렌더링
        renderFB();
    }
    
    // 이벤트 설정
    function setupMode2Events() {
        // 앞판 티셔츠 업로드
        document.getElementById('fbFrontTshirtInput').addEventListener('change', (e) => {
            loadFBTshirts(e, 'front');
        });
        
        // 앞판 디자인 업로드
        document.getElementById('fbFrontDesignInput').addEventListener('change', (e) => {
            loadFBDesign(e, 'front');
        });
        
        // 뒷판 티셔츠 업로드
        document.getElementById('fbBackTshirtInput').addEventListener('change', (e) => {
            loadFBTshirts(e, 'back');
        });
        
        // 뒷판 디자인 업로드
        document.getElementById('fbBackDesignInput').addEventListener('change', (e) => {
            loadFBDesign(e, 'back');
        });
        
        // 스케일 조절
        document.getElementById('fbFrontScale').addEventListener('input', (e) => {
            mode2State.front.scale = e.target.value / 100;
            document.getElementById('fbFrontScaleValue').textContent = e.target.value + '%';
            renderFB();
        });
        
        document.getElementById('fbBackScale').addEventListener('input', (e) => {
            mode2State.back.scale = e.target.value / 100;
            document.getElementById('fbBackScaleValue').textContent = e.target.value + '%';
            renderFB();
        });
    }
    
    // 티셔츠 로드
    function loadFBTshirts(e, side) {
        const files = Array.from(e.target.files);
        mode2State[side].tshirts = [];
        mode2State[side].currentIndex = 0;
        
        let loadedCount = 0;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    mode2State[side].tshirts.push({
                        name: file.name.split('.')[0],
                        image: img
                    });
                    
                    loadedCount++;
                    if (loadedCount === files.length) {
                        updateFBTabs();
                        updateFBFileList(side);
                        renderFB();
                        window.updateSaveButton();
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        const labelId = side === 'front' ? 'fbFrontTshirtLabel' : 'fbBackTshirtLabel';
        document.getElementById(labelId).classList.add('uploaded');
        document.getElementById(labelId).innerHTML = 
            `✅ ${side === 'front' ? '앞판' : '뒷판'} ${files.length}개<br><small>업로드 완료</small>`;
    }
    
    // 디자인 로드
    function loadFBDesign(e, side) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                mode2State[side].design = img;
                renderFB();
                window.updateSaveButton();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
        
        const labelId = side === 'front' ? 'fbFrontDesignLabel' : 'fbBackDesignLabel';
        document.getElementById(labelId).classList.add('uploaded');
        document.getElementById(labelId).innerHTML = 
            `✅ ${side === 'front' ? '앞판' : '뒷판'} 디자인<br><small>${file.name}</small>`;
    }
    
    // 드래그 설정
    function setupFBDrag(canvas, side) {
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        
        canvas.addEventListener('mousedown', (e) => {
            const data = mode2State[side];
            if (!data.design) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            const width = data.design.width * data.scale * 0.5;
            const height = data.design.height * data.scale * 0.5;
            const pos = data.position;
            
            if (x >= pos.x - width/2 && x <= pos.x + width/2 &&
                y >= pos.y - height/2 && y <= pos.y + height/2) {
                isDragging = true;
                dragStart = { x, y };
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            mode2State[side].position.x += x - dragStart.x;
            mode2State[side].position.y += y - dragStart.y;
            dragStart = { x, y };
            
            renderFBSide(side);
        });
        
        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            canvas.style.cursor = 'move';
        });
    }
    
    // 렌더링
    function renderFB() {
        renderFBSide('front');
        renderFBSide('back');
    }
    
    function renderFBSide(side) {
        const canvas = document.getElementById(side === 'front' ? 'fbFrontCanvas' : 'fbBackCanvas');
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const data = mode2State[side];
        const tshirt = data.tshirts[data.currentIndex];
        
        if (tshirt && tshirt.image) {
            const scale = Math.min(
                canvas.width / tshirt.image.width,
                canvas.height / tshirt.image.height
            ) * 0.9;
            
            const width = tshirt.image.width * scale;
            const height = tshirt.image.height * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.drawImage(tshirt.image, x, y, width, height);
        }
        
        if (data.design) {
            const width = data.design.width * data.scale * 0.5;
            const height = data.design.height * data.scale * 0.5;
            const x = data.position.x - width / 2;
            const y = data.position.y - height / 2;
            
            ctx.drawImage(data.design, x, y, width, height);
        }
    }
    
    // 탭 업데이트
    function updateFBTabs() {
        const tabs = document.getElementById('fbTabs');
        const frontCount = mode2State.front.tshirts.length;
        const backCount = mode2State.back.tshirts.length;
        const maxCount = Math.min(frontCount, backCount);
        
        tabs.innerHTML = '';
        
        if (maxCount === 0) {
            tabs.innerHTML = '<span style="color: #94a3b8; padding: 6px;">앞뒤 티셔츠를 업로드하면 색상별 탭이 표시됩니다</span>';
            return;
        }
        
        for (let i = 0; i < maxCount; i++) {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.textContent = mode2State.front.tshirts[i]?.name || `색상 ${i + 1}`;
            
            if (i === mode2State.front.currentIndex) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                mode2State.front.currentIndex = i;
                mode2State.back.currentIndex = i;
                updateFBTabs();
                renderFB();
            });
            
            tabs.appendChild(button);
        }
    }
    
    // 파일 리스트 업데이트
    function updateFBFileList(side) {
        const listId = side === 'front' ? 'fbFrontTshirtList' : 'fbBackTshirtList';
        const list = document.getElementById(listId);
        list.innerHTML = '';
        
        mode2State[side].tshirts.forEach(tshirt => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = tshirt.name;
            list.appendChild(item);
        });
    }
    
    // 고화질 렌더링 (위치 보정 포함)
    function renderFBHighQuality(ctx, canvas, tshirtImg, designImg, state) {
        const aspectCorrection = 0.83;
        
        if (tshirtImg) {
            const scale = Math.min(
                canvas.width / tshirtImg.width,
                canvas.height / tshirtImg.height
            ) * 0.9;
            
            const width = tshirtImg.width * scale;
            const height = tshirtImg.height * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.drawImage(tshirtImg, x, y, width, height);
        }
        
        if (designImg) {
            const scaleRatio = canvas.width / 600;
            const width = designImg.width * state.scale * scaleRatio * 0.5;
            const height = designImg.height * state.scale * scaleRatio * 0.5;
            
            const correctedY = state.position.y * aspectCorrection + (canvas.height * 0.1);
            
            const x = (state.position.x * scaleRatio) - width / 2;
            const y = (correctedY * scaleRatio) - height / 2;
            
            ctx.drawImage(designImg, x, y, width, height);
        }
    }
    
    // 저장 가능 체크
    window.checkModeFrontbackReady = function() {
        const hasFrontTshirts = mode2State.front.tshirts.length > 0;
        const hasBackTshirts = mode2State.back.tshirts.length > 0;
        const hasFrontDesign = mode2State.front.design !== null;
        const hasBackDesign = mode2State.back.design !== null;
        
        if (hasFrontTshirts && hasBackTshirts && hasFrontDesign && hasBackDesign) {
            const count = Math.min(
                mode2State.front.tshirts.length,
                mode2State.back.tshirts.length
            );
            return {
                ready: true,
                text: `📦 ${count}개 앞뒤 세트 저장`
            };
        }
        return { ready: false, text: '파일을 업로드하세요' };
    };
    
    // 저장 함수
    window.saveModeFrontback = async function() {
        const count = Math.min(
            mode2State.front.tshirts.length,
            mode2State.back.tshirts.length
        );
        
        const files = [];
        
        for (let i = 0; i < count; i++) {
            // 앞판
            const frontCanvas = document.createElement('canvas');
            const frontCtx = frontCanvas.getContext('2d');
            frontCanvas.width = window.outputWidth;
            frontCanvas.height = window.outputHeight;
            
            frontCtx.fillStyle = '#ffffff';
            frontCtx.fillRect(0, 0, frontCanvas.width, frontCanvas.height);
            
            renderFBHighQuality(
                frontCtx, 
                frontCanvas,
                mode2State.front.tshirts[i].image,
                mode2State.front.design,
                mode2State.front
            );
            
            const frontBlob = await new Promise(resolve => {
                frontCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            files.push({
                name: `${mode2State.front.tshirts[i].name}_front_OKSTAR.png`,
                blob: frontBlob
            });
            
            // 뒷판
            const backCanvas = document.createElement('canvas');
            const backCtx = backCanvas.getContext('2d');
            backCanvas.width = window.outputWidth;
            backCanvas.height = window.outputHeight;
            
            backCtx.fillStyle = '#ffffff';
            backCtx.fillRect(0, 0, backCanvas.width, backCanvas.height);
            
            renderFBHighQuality(
                backCtx,
                backCanvas,
                mode2State.back.tshirts[i].image,
                mode2State.back.design,
                mode2State.back
            );
            
            const backBlob = await new Promise(resolve => {
                backCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            files.push({
                name: `${mode2State.back.tshirts[i].name}_back_OKSTAR.png`,
                blob: backBlob
            });
        }
        
        await window.downloadZip(files, 'OKSTAR_FrontBack_Output');
    };
    
    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMode2);
    } else {
        initMode2();
    }
})();