// Mode 3: 디자인 합성 컴포넌트
(function() {
    'use strict';
    
    // Mode 3 상태 관리
    const mode3State = {
        frontImages: [],
        backImages: [],
        currentIndex: 0,
        sets: [],
        globalSettings: {
            layerOrder: 'front',
            opacity: 1.0
        },
        dragging: null,
        dragStart: { x: 0, y: 0 },
        removeBackground: false,
        bgSensitivity: 30,
        addDetailZoom: false,
        zoomArea: null,
        zoomLevel: 3,
        selectingZoomArea: false,
        zoomPositionX: 85,
        zoomPositionY: 70,
        zoomFixed: true,
        
        // 디테일 영역 독립 제어
        detailAreaCenter: { x: 400, y: 400 },
        detailOffsetX: 0,
        detailOffsetY: 0,
        
        // Magic Wand 모드
        magicWandMode: false
    };
    
    // HTML 템플릿
    const mode3HTML = `
        <div class="upload-grid">
            <div class="upload-section">
                <div class="section-title" style="color: #3b82f6;">
                    📸 완성된 앞판 이미지
                </div>
                <div style="padding: 20px;">
                    <input type="file" id="completeFrontInput" accept="image/*" multiple>
                    <label for="completeFrontInput" class="upload-label" id="completeFrontLabel">
                        📸 완성된 앞판<br>
                        <small>여러 개 선택 가능</small>
                    </label>
                    <div class="file-list" id="completeFrontList"></div>
                </div>
            </div>

            <div class="upload-section">
                <div class="section-title" style="color: #8b5cf6;">
                    📸 완성된 뒷판 이미지
                </div>
                <div style="padding: 20px;">
                    <input type="file" id="completeBackInput" accept="image/*" multiple>
                    <label for="completeBackInput" class="upload-label" id="completeBackLabel">
                        📸 완성된 뒷판<br>
                        <small>여러 개 선택 가능</small>
                    </label>
                    <div class="file-list" id="completeBackList"></div>
                </div>
            </div>
        </div>

        <!-- 세트 선택 탭 -->
        <div class="tab-navigation" id="combineTabs">
            <span style="color: #94a3b8; padding: 6px;">앞판과 뒷판 이미지를 업로드하면 세트별 탭이 표시됩니다</span>
        </div>

        <!-- 일괄 설정 버튼 -->
        <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #fef3c7; padding: 10px 15px; border-radius: 8px; margin-right: 10px;">
                <button id="applyToAllBtn" style="padding: 6px 12px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ⚙️ 현재 설정을 모든 세트에 적용
                </button>
            </div>
        </div>

        <!-- 레이어 순서 컨트롤 -->
        <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #f0f9ff; padding: 15px; border-radius: 10px; border: 1px solid #3b82f6;">
                <span style="font-weight: bold; margin-right: 15px;">레이어 순서:</span>
                <button id="layerFrontBtn" class="position-btn active" style="margin-right: 10px;">앞판이 위</button>
                <button id="layerBackBtn" class="position-btn">뒷판이 위</button>
                
                <span style="margin-left: 30px; font-weight: bold;">투명도:</span>
                <input type="range" id="combineOpacity" min="30" max="100" value="100" style="width: 100px; vertical-align: middle;">
                <span id="combineOpacityValue" style="margin-left: 5px;">100%</span>
            </div>
        </div>

        <!-- 배경 제거 옵션 -->
        <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background: #fef3c7; padding: 15px; border-radius: 10px; border: 1px solid #fbbf24;">
                <label style="font-weight: bold; margin-right: 10px;">
                    <input type="checkbox" id="removeBackground" style="margin-right: 5px;">
                    흰색 배경 제거 (매직완드)
                </label>
                <span style="margin-left: 20px;">감도:</span>
                <input type="range" id="bgRemoveSensitivity" min="10" max="50" value="30" style="width: 100px; vertical-align: middle;">
                <span id="bgSensitivityValue" style="margin-left: 5px;">30</span>
                <button id="magicWandBtn" style="margin-left: 15px; padding: 5px 10px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; display: none;">
                    🪄 클릭하여 배경 선택
                </button>
                <button id="resetBgBtn" style="margin-left: 5px; padding: 5px 10px; background: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer; display: none;">
                    ↻ 원본
                </button>
            </div>
        </div>

        <!-- 확대 디테일 옵션 개선 -->
        <div class="detail-control-box">
            <div class="detail-control-section">
                <div class="detail-control-title">🔍 디테일 확대 설정</div>
                
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold;">
                        <input type="checkbox" id="addDetailZoom" style="margin-right: 5px;">
                        디테일 확대컷 추가
                    </label>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <button id="selectZoomArea" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                            📍 확대 영역 선택
                        </button>
                    </div>
                    <div>
                        <span>확대 배율:</span>
                        <select id="zoomLevel" style="padding: 5px; margin-left: 5px;">
                            <option value="2">2x</option>
                            <option value="3" selected>3x</option>
                            <option value="4">4x</option>
                            <option value="5">5x</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="detail-control-section">
                <div class="detail-control-title">🎯 확대 영역 미세조정 (독립 제어)</div>
                
                <div class="control-group">
                    <span class="control-label">영역 X:</span>
                    <input type="range" id="combineDetailOffsetX" min="-100" max="100" value="0">
                    <span class="scale-value" id="combineDetailOffsetXValue">0px</span>
                </div>
                
                <div class="control-group">
                    <span class="control-label">영역 Y:</span>
                    <input type="range" id="combineDetailOffsetY" min="-100" max="100" value="0">
                    <span class="scale-value" id="combineDetailOffsetYValue">0px</span>
                </div>
                
                <div style="text-align: center; margin-top: 10px;">
                    <button id="resetCombineDetailOffset" style="padding: 6px 12px; background: #94a3b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ↻ 오프셋 초기화
                    </button>
                </div>
            </div>
            
            <div class="detail-control-section">
                <div class="detail-control-title">📍 확대컷 표시 위치</div>
                
                <div style="text-align: center; margin-bottom: 10px;">
                    <button id="combineZoomFixBtn" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                        🔒 고정
                    </button>
                    <button id="combineZoomMoveBtn" style="padding: 6px 12px; background: #94a3b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔓 이동
                    </button>
                </div>
                
                <div class="control-group">
                    <span class="control-label">가로:</span>
                    <input type="range" id="combineZoomX" min="0" max="100" value="85" disabled>
                    <span class="scale-value" id="combineZoomXValue">85%</span>
                </div>
                
                <div class="control-group">
                    <span class="control-label">세로:</span>
                    <input type="range" id="combineZoomY" min="0" max="100" value="70" disabled>
                    <span class="scale-value" id="combineZoomYValue">70%</span>
                </div>
            </div>
        </div>

        <div class="canvas-container single">
            <div class="canvas-section">
                <div class="canvas-title" style="color: #f59e0b;">
                    🎨 합성 미리보기 - 세트 <span id="currentSetNumber">1</span>/<span id="totalSetNumber">1</span>
                </div>
                <canvas id="combineCanvas" style="background: #f8f8f8;"></canvas>
                <div class="controls">
                    <div class="control-group">
                        <span class="control-label">앞판 크기:</span>
                        <input type="range" id="combineFrontScale" min="10" max="200" value="50">
                        <span class="scale-value" id="combineFrontScaleValue">50%</span>
                    </div>
                    <div class="control-group">
                        <span class="control-label">뒷판 크기:</span>
                        <input type="range" id="combineBackScale" min="10" max="200" value="100">
                        <span class="scale-value" id="combineBackScaleValue">100%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 세트 초기화
    function initializeSet(index) {
        if (!mode3State.sets[index]) {
            mode3State.sets[index] = {
                frontPosition: { x: 400, y: 400 },
                backPosition: { x: 400, y: 400 },
                frontScale: 0.5,
                backScale: 1.0,
                layerOrder: mode3State.globalSettings.layerOrder,
                opacity: mode3State.globalSettings.opacity,
                detailAreaCenter: { x: 400, y: 400 },
                detailOffsetX: 0,
                detailOffsetY: 0
            };
        }
        return mode3State.sets[index];
    }
    
    // 배경 제거 함수
    function removeWhiteBackground(imageData, sensitivity) {
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const threshold = 255 - sensitivity;
        
        const visited = new Uint8Array(width * height);
        const queue = [];
        
        const corners = [
            [0, 0], [width-1, 0], 
            [0, height-1], [width-1, height-1]
        ];
        
        corners.forEach(([x, y]) => {
            const idx = (y * width + x) * 4;
            if (data[idx] > threshold && data[idx+1] > threshold && data[idx+2] > threshold) {
                queue.push([x, y]);
                visited[y * width + x] = 1;
            }
        });
        
        while (queue.length > 0) {
            const [x, y] = queue.shift();
            const idx = (y * width + x) * 4;
            
            data[idx + 3] = 0;
            
            const neighbors = [
                [x-1, y], [x+1, y],
                [x, y-1], [x, y+1]
            ];
            
            neighbors.forEach(([nx, ny]) => {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = ny * width + nx;
                    const nDataIdx = nIdx * 4;
                    
                    if (!visited[nIdx] && 
                        data[nDataIdx] > threshold && 
                        data[nDataIdx+1] > threshold && 
                        data[nDataIdx+2] > threshold) {
                        visited[nIdx] = 1;
                        queue.push([nx, ny]);
                    }
                }
            });
        }
        
        return imageData;
    }
    
    // 초기화 함수
    function initMode3() {
        const container = document.getElementById('combineMode');
        container.innerHTML = mode3HTML;
        
        const canvas = document.getElementById('combineCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 800;
        canvas.height = 800;
        
        // 이벤트 설정
        setupMode3Events(canvas, ctx);
        
        // appState에 연결
        window.appState.modes.combine = mode3State;
        
        // 초기 렌더링
        renderCombine(canvas, ctx);
    }
    
    // 이벤트 설정
    function setupMode3Events(canvas, ctx) {
        // 앞판 업로드
        document.getElementById('completeFrontInput').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            mode3State.frontImages = [];
            mode3State.sets = [];
            mode3State.currentIndex = 0;
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        mode3State.frontImages[index] = {
                            name: file.name.split('.')[0],
                            image: img
                        };
                        
                        loadedCount++;
                        if (loadedCount === files.length) {
                            updateCombineTabs();
                            updateCombineFileList('front');
                            renderCombine(canvas, ctx);
                            window.updateSaveButton();
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
            
            document.getElementById('completeFrontLabel').classList.add('uploaded');
            document.getElementById('completeFrontLabel').innerHTML = 
                `✅ 앞판 ${files.length}개<br><small>업로드 완료</small>`;
        });
        
        // 뒷판 업로드
        document.getElementById('completeBackInput').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            mode3State.backImages = [];
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        mode3State.backImages[index] = {
                            name: file.name.split('.')[0],
                            image: img
                        };
                        
                        loadedCount++;
                        if (loadedCount === files.length) {
                            updateCombineTabs();
                            updateCombineFileList('back');
                            renderCombine(canvas, ctx);
                            window.updateSaveButton();
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
            
            document.getElementById('completeBackLabel').classList.add('uploaded');
            document.getElementById('completeBackLabel').innerHTML = 
                `✅ 뒷판 ${files.length}개<br><small>업로드 완료</small>`;
        });
        
        // 설정 적용
        document.getElementById('applyToAllBtn').addEventListener('click', () => {
            const currentSet = initializeSet(mode3State.currentIndex);
            const maxCount = Math.min(mode3State.frontImages.length, mode3State.backImages.length);
            
            for (let i = 0; i < maxCount; i++) {
                if (i !== mode3State.currentIndex) {
                    mode3State.sets[i] = JSON.parse(JSON.stringify(currentSet));
                }
            }
            
            alert(`현재 설정이 ${maxCount}개 세트 모두에 적용되었습니다!`);
        });
        
        // 레이어 순서
        document.getElementById('layerFrontBtn').addEventListener('click', () => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.layerOrder = 'front';
            document.getElementById('layerFrontBtn').classList.add('active');
            document.getElementById('layerBackBtn').classList.remove('active');
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('layerBackBtn').addEventListener('click', () => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.layerOrder = 'back';
            document.getElementById('layerBackBtn').classList.add('active');
            document.getElementById('layerFrontBtn').classList.remove('active');
            renderCombine(canvas, ctx);
        });
        
        // 투명도
        document.getElementById('combineOpacity').addEventListener('input', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.opacity = e.target.value / 100;
            document.getElementById('combineOpacityValue').textContent = e.target.value + '%';
            renderCombine(canvas, ctx);
        });
        
        // 배경 제거
        document.getElementById('removeBackground').addEventListener('change', (e) => {
            mode3State.removeBackground = e.target.checked;
            
            // Magic Wand 버튼 표시/숨기기
            const magicWandBtn = document.getElementById('magicWandBtn');
            const resetBtn = document.getElementById('resetBgBtn');
            if (e.target.checked) {
                magicWandBtn.style.display = 'inline-block';
                resetBtn.style.display = 'inline-block';
            } else {
                magicWandBtn.style.display = 'none';
                resetBtn.style.display = 'none';
            }
            
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('bgRemoveSensitivity').addEventListener('input', async (e) => {
            mode3State.bgSensitivity = parseInt(e.target.value);
            document.getElementById('bgSensitivityValue').textContent = e.target.value;
            
            // 자동 흰색 배경 제거 적용
            if (mode3State.removeBackground && mode3State.frontImages[mode3State.currentIndex]) {
                const tolerance = mode3State.bgSensitivity;
                const frontImg = mode3State.frontImages[mode3State.currentIndex];
                
                // 원본 이미지 백업
                if (!frontImg.originalImage) {
                    frontImg.originalImage = frontImg.image;
                }
                
                // 흰색 배경 제거 적용 (Promise 대기)
                frontImg.processedImage = await removeWhiteBackground(frontImg.originalImage, tolerance);
                renderCombine(canvas, ctx);
            }
        });
        
        // Magic Wand 버튼 클릭
        document.getElementById('magicWandBtn').addEventListener('click', () => {
            mode3State.magicWandMode = true;
            const canvas = document.getElementById('combineCanvas');
            canvas.style.cursor = 'crosshair';
            alert('클릭하여 제거할 배경 색상을 선택하세요.');
        });
        
        // 원본 복구 버튼
        document.getElementById('resetBgBtn').addEventListener('click', () => {
            const frontImg = mode3State.frontImages[mode3State.currentIndex];
            if (frontImg && frontImg.originalImage) {
                frontImg.processedImage = null;
                renderCombine(canvas, ctx);
            }
        });
        
        // 캔버스 클릭 이벤트 (Magic Wand)
        canvas.addEventListener('click', async (e) => {
            if (!mode3State.magicWandMode || !mode3State.removeBackground) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const frontImg = mode3State.frontImages[mode3State.currentIndex];
            if (!frontImg) return;
            
            // 원본 이미지 백업
            if (!frontImg.originalImage) {
                frontImg.originalImage = frontImg.image;
            }
            
            // 이미지 상의 실제 클릭 좌표 계산
            const currentSet = initializeSet(mode3State.currentIndex);
            const imgScale = currentSet.frontScale * 0.5;
            const imgWidth = frontImg.originalImage.width * imgScale;
            const imgHeight = frontImg.originalImage.height * imgScale;
            const imgX = currentSet.frontPosition.x - imgWidth / 2;
            const imgY = currentSet.frontPosition.y - imgHeight / 2;
            
            // 이미지 범위 내 클릭인지 확인
            if (x >= imgX && x <= imgX + imgWidth && y >= imgY && y <= imgY + imgHeight) {
                // 원본 이미지 좌표로 변환
                const origX = Math.floor((x - imgX) / imgScale);
                const origY = Math.floor((y - imgY) / imgScale);
                
                // Magic Wand 적용 (Promise 대기)
                const tolerance = mode3State.bgSensitivity;
                frontImg.processedImage = await applyMagicWand(frontImg.originalImage, origX, origY, tolerance);
                renderCombine(canvas, ctx);
            }
            
            mode3State.magicWandMode = false;
            canvas.style.cursor = 'default';
        });
        
        // 디테일 확대
        document.getElementById('addDetailZoom').addEventListener('change', (e) => {
            mode3State.addDetailZoom = e.target.checked;
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('zoomLevel').addEventListener('change', (e) => {
            mode3State.zoomLevel = parseInt(e.target.value);
            renderCombine(canvas, ctx);
        });
        
        // 확대 영역 선택
        document.getElementById('selectZoomArea').addEventListener('click', () => {
            mode3State.selectingZoomArea = true;
            canvas.style.cursor = 'crosshair';
            alert('확대할 영역의 중심을 클릭하세요');
        });
        
        // 디테일 오프셋
        document.getElementById('combineDetailOffsetX').addEventListener('input', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.detailOffsetX = parseInt(e.target.value);
            document.getElementById('combineDetailOffsetXValue').textContent = e.target.value + 'px';
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('combineDetailOffsetY').addEventListener('input', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.detailOffsetY = parseInt(e.target.value);
            document.getElementById('combineDetailOffsetYValue').textContent = e.target.value + 'px';
            renderCombine(canvas, ctx);
        });
        
        // 오프셋 초기화
        document.getElementById('resetCombineDetailOffset').addEventListener('click', () => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.detailOffsetX = 0;
            currentSet.detailOffsetY = 0;
            document.getElementById('combineDetailOffsetX').value = 0;
            document.getElementById('combineDetailOffsetY').value = 0;
            document.getElementById('combineDetailOffsetXValue').textContent = '0px';
            document.getElementById('combineDetailOffsetYValue').textContent = '0px';
            renderCombine(canvas, ctx);
        });
        
        // 확대컷 위치
        document.getElementById('combineZoomFixBtn').addEventListener('click', () => {
            mode3State.zoomFixed = true;
            document.getElementById('combineZoomFixBtn').style.background = '#3b82f6';
            document.getElementById('combineZoomMoveBtn').style.background = '#94a3b8';
            document.getElementById('combineZoomX').disabled = true;
            document.getElementById('combineZoomY').disabled = true;
        });
        
        document.getElementById('combineZoomMoveBtn').addEventListener('click', () => {
            mode3State.zoomFixed = false;
            document.getElementById('combineZoomMoveBtn').style.background = '#3b82f6';
            document.getElementById('combineZoomFixBtn').style.background = '#94a3b8';
            document.getElementById('combineZoomX').disabled = false;
            document.getElementById('combineZoomY').disabled = false;
        });
        
        document.getElementById('combineZoomX').addEventListener('input', (e) => {
            mode3State.zoomPositionX = parseInt(e.target.value);
            document.getElementById('combineZoomXValue').textContent = e.target.value + '%';
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('combineZoomY').addEventListener('input', (e) => {
            mode3State.zoomPositionY = parseInt(e.target.value);
            document.getElementById('combineZoomYValue').textContent = e.target.value + '%';
            renderCombine(canvas, ctx);
        });
        
        // 스케일 조절
        document.getElementById('combineFrontScale').addEventListener('input', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.frontScale = e.target.value / 100;
            document.getElementById('combineFrontScaleValue').textContent = e.target.value + '%';
            renderCombine(canvas, ctx);
        });
        
        document.getElementById('combineBackScale').addEventListener('input', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.backScale = e.target.value / 100;
            document.getElementById('combineBackScaleValue').textContent = e.target.value + '%';
            renderCombine(canvas, ctx);
        });
        
        // 캔버스 이벤트
        canvas.addEventListener('click', (e) => {
            if (!mode3State.selectingZoomArea) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            const currentSet = initializeSet(mode3State.currentIndex);
            currentSet.detailAreaCenter = { x, y };
            mode3State.selectingZoomArea = false;
            canvas.style.cursor = 'default';
            
            renderCombine(canvas, ctx);
        });
        
        // 드래그 이벤트
        setupCombineDrag(canvas, ctx);
    }
    
    // 드래그 설정
    function setupCombineDrag(canvas, ctx) {
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            const currentSet = initializeSet(mode3State.currentIndex);
            const frontImg = mode3State.frontImages[mode3State.currentIndex];
            const backImg = mode3State.backImages[mode3State.currentIndex];
            
            if (!frontImg || !backImg) return;
            
            // 클릭 위치 확인
            if (isInsideImage(x, y, frontImg.image, currentSet.frontPosition, currentSet.frontScale)) {
                mode3State.dragging = 'front';
                mode3State.dragStart = { 
                    x: x - currentSet.frontPosition.x, 
                    y: y - currentSet.frontPosition.y 
                };
            } else if (isInsideImage(x, y, backImg.image, currentSet.backPosition, currentSet.backScale)) {
                mode3State.dragging = 'back';
                mode3State.dragStart = { 
                    x: x - currentSet.backPosition.x, 
                    y: y - currentSet.backPosition.y 
                };
            }
            
            if (mode3State.dragging) {
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const currentSet = initializeSet(mode3State.currentIndex);
            
            if (!mode3State.dragging) {
                const rect = canvas.getBoundingClientRect();
                const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                
                const frontImg = mode3State.frontImages[mode3State.currentIndex];
                const backImg = mode3State.backImages[mode3State.currentIndex];
                
                if ((frontImg && isInsideImage(x, y, frontImg.image, currentSet.frontPosition, currentSet.frontScale)) ||
                    (backImg && isInsideImage(x, y, backImg.image, currentSet.backPosition, currentSet.backScale))) {
                    canvas.style.cursor = 'grab';
                } else {
                    canvas.style.cursor = 'default';
                }
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            if (mode3State.dragging === 'front') {
                currentSet.frontPosition.x = x - mode3State.dragStart.x;
                currentSet.frontPosition.y = y - mode3State.dragStart.y;
            } else if (mode3State.dragging === 'back') {
                currentSet.backPosition.x = x - mode3State.dragStart.x;
                currentSet.backPosition.y = y - mode3State.dragStart.y;
            }
            
            renderCombine(canvas, ctx);
        });
        
        canvas.addEventListener('mouseup', () => {
            mode3State.dragging = null;
            canvas.style.cursor = 'default';
        });
    }
    
    // 이미지 내부 체크
    function isInsideImage(x, y, image, position, scale) {
        if (!image) return false;
        
        const width = image.width * scale * 0.5;
        const height = image.height * scale * 0.5;
        
        return x >= position.x - width / 2 && x <= position.x + width / 2 &&
               y >= position.y - height / 2 && y <= position.y + height / 2;
    }
    
    // 렌더링
    function renderCombine(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 체크패턴 배경
        const checkSize = 20;
        for (let i = 0; i < canvas.width; i += checkSize) {
            for (let j = 0; j < canvas.height; j += checkSize) {
                ctx.fillStyle = ((i / checkSize + j / checkSize) % 2 === 0) ? '#f0f0f0' : '#ffffff';
                ctx.fillRect(i, j, checkSize, checkSize);
            }
        }
        
        const currentSet = initializeSet(mode3State.currentIndex);
        const frontImg = mode3State.frontImages[mode3State.currentIndex];
        const backImg = mode3State.backImages[mode3State.currentIndex];
        
        if (!frontImg || !backImg) return;
        
        if (!mode3State.removeBackground) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // 레이어 순서대로 그리기
        // 처리된 이미지가 있으면 사용, 없으면 원본 사용
        const frontImageToUse = frontImg.processedImage || frontImg.image;
        const backImageToUse = backImg.image;
        
        if (currentSet.layerOrder === 'front') {
            drawImage(ctx, backImageToUse, currentSet.backPosition, currentSet.backScale, currentSet.opacity);
            drawImage(ctx, frontImageToUse, currentSet.frontPosition, currentSet.frontScale, currentSet.opacity);
        } else {
            drawImage(ctx, frontImageToUse, currentSet.frontPosition, currentSet.frontScale, currentSet.opacity);
            drawImage(ctx, backImageToUse, currentSet.backPosition, currentSet.backScale, currentSet.opacity);
        }
        
        // 디테일 확대 표시
        if (mode3State.addDetailZoom && currentSet.detailAreaCenter) {
            const detailX = currentSet.detailAreaCenter.x + currentSet.detailOffsetX;
            const detailY = currentSet.detailAreaCenter.y + currentSet.detailOffsetY;
            const areaSize = 100 / mode3State.zoomLevel;
            
            // 가이드 박스
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(detailX - areaSize/2, detailY - areaSize/2, areaSize, areaSize);
            ctx.setLineDash([]);
            
            // 확대 미리보기
            const zoomSize = 150;
            const zoomX = (canvas.width - zoomSize) * (mode3State.zoomPositionX / 100);
            const zoomY = (canvas.height - zoomSize) * (mode3State.zoomPositionY / 100);
            
            ctx.save();
            ctx.beginPath();
            ctx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
            ctx.clip();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(zoomX, zoomY, zoomSize, zoomSize);
            
            ctx.drawImage(canvas,
                detailX - areaSize/2,
                detailY - areaSize/2,
                areaSize,
                areaSize,
                zoomX, zoomY, zoomSize, zoomSize
            );
            
            ctx.restore();
            
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    function drawImage(ctx, image, position, scale, opacity) {
        if (!image) return;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        const width = image.width * scale * 0.5;
        const height = image.height * scale * 0.5;
        const x = position.x - width / 2;
        const y = position.y - height / 2;
        
        ctx.drawImage(image, x, y, width, height);
        ctx.restore();
    }
    
    // Magic Wand 배경 제거 함수들
    async function applyMagicWand(image, clickX, clickY, tolerance) {
        // 임시 캔버스 생성
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // 이미지 그리기
        tempCtx.drawImage(image, 0, 0);
        
        // 이미지 데이터 가져오기
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // 클릭한 픽셀의 색상 가져오기
        const targetIndex = (clickY * tempCanvas.width + clickX) * 4;
        const targetR = data[targetIndex];
        const targetG = data[targetIndex + 1];
        const targetB = data[targetIndex + 2];
        
        // Flood Fill 알고리즘 구현
        const visited = new Set();
        const stack = [[clickX, clickY]];
        
        // TODO(human): Flood Fill 알고리즘 구현
        // 스택을 사용한 반복적 접근으로 인접 픽셀 탐색
        // tolerance 범위 내의 색상을 가진 픽셀을 투명하게 처리
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const key = `${x},${y}`;
            
            if (visited.has(key)) continue;
            if (x < 0 || x >= tempCanvas.width || y < 0 || y >= tempCanvas.height) continue;
            
            visited.add(key);
            
            const idx = (y * tempCanvas.width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            
            // 색상 차이 계산
            const diff = Math.abs(r - targetR) + Math.abs(g - targetG) + Math.abs(b - targetB);
            
            if (diff <= tolerance * 3) {
                // 투명하게 만들기
                data[idx + 3] = 0;
                
                // 인접 픽셀 추가
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }
        
        // 수정된 이미지 데이터 적용
        tempCtx.putImageData(imageData, 0, 0);
        
        // 새 이미지로 반환 (Promise로 로드 보장)
        const newImage = new Image();
        return new Promise((resolve) => {
            newImage.onload = () => resolve(newImage);
            newImage.src = tempCanvas.toDataURL();
        });
    }
    
    // 전체 배경 제거 (흰색 기준)
    async function removeWhiteBackground(image, tolerance) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.drawImage(image, 0, 0);
        
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        // 흰색에 가까운 픽셀 투명하게
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 흰색과의 차이 계산
            const diff = Math.abs(r - 255) + Math.abs(g - 255) + Math.abs(b - 255);
            
            if (diff <= tolerance * 3) {
                data[i + 3] = 0; // 알파 채널을 0으로
            }
        }
        
        tempCtx.putImageData(imageData, 0, 0);
        
        // 새 이미지로 반환 (Promise로 로드 보장)
        const newImage = new Image();
        return new Promise((resolve) => {
            newImage.onload = () => resolve(newImage);
            newImage.src = tempCanvas.toDataURL();
        });
    }
    
    // 탭 업데이트
    function updateCombineTabs() {
        const tabs = document.getElementById('combineTabs');
        const frontCount = mode3State.frontImages.length;
        const backCount = mode3State.backImages.length;
        const maxCount = Math.min(frontCount, backCount);
        
        tabs.innerHTML = '';
        
        if (maxCount === 0) {
            tabs.innerHTML = '<span style="color: #94a3b8; padding: 6px;">앞판과 뒷판 이미지를 업로드하면 세트별 탭이 표시됩니다</span>';
            document.getElementById('currentSetNumber').textContent = '0';
            document.getElementById('totalSetNumber').textContent = '0';
            return;
        }
        
        for (let i = 0; i < maxCount; i++) {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.textContent = `세트 ${i + 1}`;
            
            if (i === mode3State.currentIndex) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                mode3State.currentIndex = i;
                updateCombineTabs();
                updateControlsFromSet();
                renderCombine(
                    document.getElementById('combineCanvas'),
                    document.getElementById('combineCanvas').getContext('2d')
                );
            });
            
            tabs.appendChild(button);
        }
        
        document.getElementById('currentSetNumber').textContent = mode3State.currentIndex + 1;
        document.getElementById('totalSetNumber').textContent = maxCount;
    }
    
    // 컨트롤 업데이트
    function updateControlsFromSet() {
        const currentSet = initializeSet(mode3State.currentIndex);
        
        document.getElementById('combineFrontScale').value = currentSet.frontScale * 100;
        document.getElementById('combineFrontScaleValue').textContent = 
            Math.round(currentSet.frontScale * 100) + '%';
        
        document.getElementById('combineBackScale').value = currentSet.backScale * 100;
        document.getElementById('combineBackScaleValue').textContent = 
            Math.round(currentSet.backScale * 100) + '%';
        
        document.getElementById('combineDetailOffsetX').value = currentSet.detailOffsetX;
        document.getElementById('combineDetailOffsetXValue').textContent = 
            currentSet.detailOffsetX + 'px';
        
        document.getElementById('combineDetailOffsetY').value = currentSet.detailOffsetY;
        document.getElementById('combineDetailOffsetYValue').textContent = 
            currentSet.detailOffsetY + 'px';
    }
    
    // 파일 리스트 업데이트
    function updateCombineFileList(side) {
        const listId = side === 'front' ? 'completeFrontList' : 'completeBackList';
        const list = document.getElementById(listId);
        const images = side === 'front' ? mode3State.frontImages : mode3State.backImages;
        
        list.innerHTML = '';
        images.forEach(img => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = img.name;
            list.appendChild(item);
        });
    }
    
    // 저장 가능 체크
    window.checkModeCombineReady = function() {
        const frontCount = mode3State.frontImages.length;
        const backCount = mode3State.backImages.length;
        
        if (frontCount > 0 && backCount > 0) {
            const setCount = Math.min(frontCount, backCount);
            return {
                ready: true,
                text: setCount > 1 ? `🎨 ${setCount}개 세트 합성 저장` : '🎨 합성 이미지 저장'
            };
        }
        return { ready: false, text: '파일을 업로드하세요' };
    };
    
    // 저장 함수
    window.saveModeCombine = async function() {
        const maxCount = Math.min(mode3State.frontImages.length, mode3State.backImages.length);
        const files = [];
        
        for (let i = 0; i < maxCount; i++) {
            const currentSet = initializeSet(i);
            const frontImg = mode3State.frontImages[i];
            const backImg = mode3State.backImages[i];
            
            if (!frontImg || !backImg) continue;
            
            const saveCanvas = document.createElement('canvas');
            const saveCtx = saveCanvas.getContext('2d');
            saveCanvas.width = window.outputWidth;
            saveCanvas.height = window.outputHeight;
            
            if (!mode3State.removeBackground) {
                saveCtx.fillStyle = '#ffffff';
                saveCtx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);
            }
            
            const scaleRatio = window.outputWidth / 800;
            
            // 처리된 이미지가 있으면 사용, 없으면 원본 사용
            const frontImageToUse = frontImg.processedImage || frontImg.image;
            const backImageToUse = backImg.image;
            
            // 이미지 로드 대기
            const waitForImages = [];
            
            if (frontImg.processedImage && !frontImg.processedImage.complete) {
                waitForImages.push(new Promise(resolve => {
                    frontImg.processedImage.onload = resolve;
                    frontImg.processedImage.onerror = resolve;
                }));
            }
            
            // 모든 이미지 로드 대기
            if (waitForImages.length > 0) {
                await Promise.all(waitForImages);
            }
            
            // 레이어 순서대로 그리기
            if (currentSet.layerOrder === 'front') {
                drawToCanvas(saveCtx, backImageToUse, currentSet.backPosition, currentSet.backScale, scaleRatio);
                if (frontImageToUse.complete || !frontImg.processedImage) {
                    drawToCanvas(saveCtx, frontImageToUse, currentSet.frontPosition, currentSet.frontScale, scaleRatio);
                }
            } else {
                if (frontImageToUse.complete || !frontImg.processedImage) {
                    drawToCanvas(saveCtx, frontImageToUse, currentSet.frontPosition, currentSet.frontScale, scaleRatio);
                }
                drawToCanvas(saveCtx, backImageToUse, currentSet.backPosition, currentSet.backScale, scaleRatio);
            }
            // 배경 제거는 이미 processedImage에 적용되어 있음
            
            // 디테일 확대
            if (mode3State.addDetailZoom && currentSet.detailAreaCenter) {
                const detailX = (currentSet.detailAreaCenter.x + currentSet.detailOffsetX) * scaleRatio;
                const detailY = (currentSet.detailAreaCenter.y + currentSet.detailOffsetY) * scaleRatio;
                
                const zoomSize = 400;
                const zoomX = (window.outputWidth - zoomSize) * (mode3State.zoomPositionX / 100);
                const zoomY = (window.outputHeight - zoomSize) * (mode3State.zoomPositionY / 100);
                
                saveCtx.save();
                saveCtx.beginPath();
                saveCtx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
                saveCtx.clip();
                
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = saveCanvas.width;
                tempCanvas.height = saveCanvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(saveCanvas, 0, 0);
                
                const sourceSize = (100 / mode3State.zoomLevel) * scaleRatio;
                
                saveCtx.drawImage(tempCanvas,
                    detailX - sourceSize/2,
                    detailY - sourceSize/2,
                    sourceSize,
                    sourceSize,
                    zoomX, zoomY, zoomSize, zoomSize
                );
                
                saveCtx.restore();
                
                saveCtx.strokeStyle = '#e2e8f0';
                saveCtx.lineWidth = 2;
                saveCtx.beginPath();
                saveCtx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
                saveCtx.stroke();
            }
            
            const blob = await new Promise(resolve => {
                saveCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            files.push({
                name: `combined_set_${i + 1}_OKSTAR.png`,
                blob
            });
        }
        
        if (files.length > 1) {
            await window.downloadZip(files, 'OKSTAR_Combined_Output');
        } else if (files.length === 1) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(files[0].blob);
            a.download = files[0].name;
            a.click();
            window.showSaveSuccess('합성 이미지 저장 완료!');
        }
        
        function drawToCanvas(ctx, image, position, scale, ratio = 1) {
            if (!image) return;
            const width = image.width * scale * 0.5 * ratio;
            const height = image.height * scale * 0.5 * ratio;
            const x = position.x * ratio - width / 2;
            const y = position.y * ratio - height / 2;
            ctx.drawImage(image, x, y, width, height);
        }
    };
    
    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMode3);
    } else {
        initMode3();
    }
})();