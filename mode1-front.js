// Mode 1: 앞판 전용 컴포넌트
(function() {
    'use strict';

    // Mode 1 상태 관리
    const mode1State = {
        tshirts: [],
        design: null,
        currentIndex: 0,
        designPosition: { x: 0.5, y: 0.4 }, // 정규화된 상대 좌표 (0-1)
        designScale: 0.3,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        mainDesignLocked: false,
        thumbnail: {
            enabled: true,
            position: { x: 0.8, y: 0.2 }, // 정규화된 위치 (0-1)
            zoomLevel: 3,
            size: 150,
            minSize: 100,
            maxSize: 300,
            border: 3
        },
        // 원본 이미지 하나로 통일
        originalImages: {
            design: null,
            tshirts: []
        },
        // 메모리 관리를 위한 URL 추적
        objectURLs: new Set()
    };

    // HTML 템플릿
    const mode1HTML = `
        <style>
            .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
            .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
            input:checked + .slider { background-color: #2196F3; }
            input:checked + .slider:before { transform: translateX(22px); }
            .slider.round { border-radius: 28px; }
            .slider.round:before { border-radius: 50%; }
        </style>
        <div class="upload-grid single">
            <div class="upload-section">
                <div class="section-title" style="color: #3b82f6;">
                    👔 앞판 전용
                </div>
                <div class="upload-row">
                    <div>
                        <input type="file" id="frontTshirtInput" accept="image/*" multiple>
                        <label for="frontTshirtInput" class="upload-label" id="frontTshirtLabel">
                            📁 앞판 무지티셔츠<br>
                            <small>여러 색상 선택 가능</small>
                        </label>
                        <div class="file-list" id="frontTshirtList"></div>
                    </div>
                    <div>
                        <input type="file" id="frontDesignInput" accept="image/*">
                        <label for="frontDesignInput" class="upload-label" id="frontDesignLabel">
                            🎨 앞판 디자인<br>
                            <small>가슴 로고</small>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <div class="tab-navigation" id="frontTabs">
            <span style="color: #94a3b8; padding: 6px;">티셔츠를 업로드하면 색상별 탭이 표시됩니다</span>
        </div>

        <div class="canvas-container single">
            <div class="canvas-section">
                <div class="canvas-title" style="color: #3b82f6;">👔 앞판 미리보기</div>
                <canvas id="frontCanvas"></canvas>
                <div class="controls">
                    <div class="control-group">
                        <span class="control-label">크기:</span>
                        <input type="range" id="frontScale" min="5" max="200" value="30">
                        <span class="scale-value" id="frontScaleValue">30%</span>
                    </div>
                    <div class="control-group">
                        <label style="font-weight: bold;">
                            <input type="checkbox" id="mainDesignLock" style="margin-right: 5px;">
                            메인 디자인 위치 고정
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- 디테일 썸네일 컨트롤 -->
        <div class="detail-control-box">
            <div class="detail-control-section">
                <div class="detail-control-title">🔍 디테일 썸네일</div>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
                    <label style="font-weight: bold;">썸네일 표시</label>
                    <label class="switch">
                        <input type="checkbox" id="thumbnailToggle" checked>
                        <span class="slider round"></span>
                    </label>
                </div>
                <div class="control-group">
                    <span class="control-label">확대 배율:</span>
                    <input type="range" id="thumbnailZoom" min="2" max="8" value="3">
                    <span class="scale-value" id="thumbnailZoomValue">3x</span>
                </div>
                <div class="control-group">
                    <span class="control-label">썸네일 크기:</span>
                    <input type="range" id="thumbnailSize" min="100" max="300" value="150" step="10">
                    <span class="scale-value" id="thumbnailSizeValue">150px</span>
                </div>
            </div>
            <div class="detail-control-section">
                <div class="detail-control-title">📍 썸네일 위치</div>
                <div class="control-group">
                    <span class="control-label">가로:</span>
                    <input type="range" id="thumbnailPosX" min="0" max="100" value="80">
                    <span class="scale-value" id="thumbnailPosXValue">80%</span>
                </div>
                <div class="control-group">
                    <span class="control-label">세로:</span>
                    <input type="range" id="thumbnailPosY" min="0" max="100" value="20">
                    <span class="scale-value" id="thumbnailPosYValue">20%</span>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button id="thumbnailReset" style="padding: 5px 10px; background: #6366f1; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ↻ 위치 초기화
                    </button>
                </div>
            </div>
        </div>
    `;

    // --- 헬퍼 함수 ---
    function getTshirtDrawParams(canvas, tshirtImg) {
        if (!tshirtImg) return null;
        const scale = Math.min(canvas.width / tshirtImg.width, canvas.height / tshirtImg.height) * 0.9;
        const width = tshirtImg.width * scale;
        const height = tshirtImg.height * scale;
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        return { x, y, width, height };
    }

    function getDesignDrawParams(designImg, relPosition, designScale, tshirtDrawParams) {
        if (!designImg || !tshirtDrawParams) return null;
        
        // 티셔츠 크기에 비례하여 디자인 크기 조정
        // 미리보기(600x720)에서의 기준 티셔츠 너비
        const basePreviewTshirtWidth = 518.4;  // 600 * 0.9 * (tshirt 비율)
        
        // 현재 티셔츠 너비와 기준 너비의 비율
        const scaleFactor = tshirtDrawParams.width / basePreviewTshirtWidth;
        
        // 디자인 크기를 티셔츠 크기에 비례하여 조정
        const designWidth = designImg.width * designScale * scaleFactor;
        const designHeight = designImg.height * designScale * scaleFactor;
        
        // 위치 계산 (상대 위치 사용)
        const absX = tshirtDrawParams.x + relPosition.x * tshirtDrawParams.width;
        const absY = tshirtDrawParams.y + relPosition.y * tshirtDrawParams.height;

        return { x: absX - designWidth / 2, y: absY - designHeight / 2, width: designWidth, height: designHeight };
    }


    // --- 초기화 ---
    function initMode1() {
        console.log('[Mode1] Starting initialization...');
        
        const container = document.getElementById('frontMode');
        if (!container) {
            console.error('[Mode1] ERROR: frontMode container not found');
            return;
        }
        
        console.log('[Mode1] Container found, injecting HTML...');
        container.innerHTML = mode1HTML;
        
        // HTML 주입 후 엘리먼트 확인
        const uploadSection = container.querySelector('.upload-section');
        const fileInputs = container.querySelectorAll('input[type="file"]');
        
        console.log('[Mode1] Upload section found:', !!uploadSection);
        console.log('[Mode1] File inputs found:', fileInputs.length);
        
        const canvas = document.getElementById('frontCanvas');
        if (!canvas) {
            console.error('[Mode1] ERROR: frontCanvas not found after HTML injection');
            console.log('[Mode1] Container HTML:', container.innerHTML.substring(0, 200));
            return;
        }
        
        console.log('[Mode1] Canvas found, setting up...');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 720;
        
        setupMode1Events(canvas, ctx);
        
        // appState 초기화 확인
        if (!window.appState) {
            console.log('[Mode1] Creating appState...');
            window.appState = { modes: {} };
        }
        if (!window.appState.modes) {
            window.appState.modes = {};
        }
        
        window.appState.modes.front = mode1State;
        renderFront(canvas, ctx);
        
        console.log('[Mode1] Initialization complete!');
    }

    // --- 이벤트 설정 ---
    function setupMode1Events(canvas, ctx) {
        console.log('[Mode1] Setting up events...');
        
        // 파일 업로드 - 티셔츠
        const tshirtInput = document.getElementById('frontTshirtInput');
        if (!tshirtInput) {
            console.error('[Mode1] ERROR: frontTshirtInput not found');
            return;
        }
        
        tshirtInput.addEventListener('change', (e) => {
            console.log('[Mode1] T-shirt file selected:', e.target.files.length, 'files');
            const files = Array.from(e.target.files);
            mode1State.tshirts = [];
            mode1State.currentIndex = 0;
            
            let loadedCount = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        mode1State.tshirts.push({ name: file.name.split('.')[0], image: img });
                        if (loadedCount === 0) mode1State.tshirtOriginal = img;
                        
                        loadedCount++;
                        if (loadedCount === files.length) {
                            updateFrontTabs();
                            updateFrontFileList();
                            renderFront(canvas, ctx);
                            window.updateSaveButton();
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
            
            document.getElementById('frontTshirtLabel').classList.add('uploaded');
            document.getElementById('frontTshirtLabel').innerHTML = `✅ ${files.length}개 티셔츠<br><small>업로드 완료</small>`;
        });

        // 파일 업로드 - 디자인
        const designInput = document.getElementById('frontDesignInput');
        if (!designInput) {
            console.error('[Mode1] ERROR: frontDesignInput not found');
            return;
        }
        
        designInput.addEventListener('change', (e) => {
            console.log('[Mode1] Design file selected');
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                // 파일 검증
                if (window.TDesignUtils) {
                    window.TDesignUtils.Validator.validateImageFile(file);
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    
                    // 에러 처리 추가
                    img.onload = () => {
                        try {
                            mode1State.design = img;
                            mode1State.originalImages.design = img; // 원본 통일
                            renderFront(canvas, ctx);
                            window.updateSaveButton();
                        } catch (error) {
                            console.error('Design processing error:', error);
                            alert('디자인 처리 중 오류가 발생했습니다.');
                        }
                    };
                    
                    img.onerror = () => {
                        console.error('Design image load failed');
                        alert('디자인 이미지를 불러올 수 없습니다.');
                    };
                    
                    img.src = event.target.result;
                };
                
                reader.onerror = () => {
                    console.error('File read error');
                    alert('파일을 읽을 수 없습니다.');
                };
                
                reader.readAsDataURL(file);
                
                document.getElementById('frontDesignLabel').classList.add('uploaded');
                document.getElementById('frontDesignLabel').textContent = `✅ 디자인: ${file.name}`;
            } catch (error) {
                alert(error.message);
            }
        });

        // 컨트롤
        document.getElementById('frontScale').addEventListener('input', (e) => {
            mode1State.designScale = e.target.value / 100;
            document.getElementById('frontScaleValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });

        document.getElementById('mainDesignLock').addEventListener('change', (e) => {
            mode1State.mainDesignLocked = e.target.checked;
            canvas.style.cursor = e.target.checked ? 'default' : 'move';
        });

        // 썸네일 컨트롤
        document.getElementById('thumbnailToggle').addEventListener('change', (e) => {
            mode1State.thumbnail.enabled = e.target.checked;
            renderFront(canvas, ctx);
        });

        document.getElementById('thumbnailZoom').addEventListener('input', (e) => {
            mode1State.thumbnail.zoomLevel = parseInt(e.target.value);
            document.getElementById('thumbnailZoomValue').textContent = e.target.value + 'x';
            renderFront(canvas, ctx);
        });

        // 썸네일 크기 조절
        document.getElementById('thumbnailSize').addEventListener('input', (e) => {
            mode1State.thumbnail.size = parseInt(e.target.value);
            document.getElementById('thumbnailSizeValue').textContent = e.target.value + 'px';
            renderFront(canvas, ctx);
        });

        // 썸네일 위치 슬라이더
        document.getElementById('thumbnailPosX').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            mode1State.thumbnail.position.x = value;
            document.getElementById('thumbnailPosXValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });

        document.getElementById('thumbnailPosY').addEventListener('input', (e) => {
            const value = e.target.value / 100;
            mode1State.thumbnail.position.y = value;
            document.getElementById('thumbnailPosYValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });

        // 위치 초기화 버튼
        document.getElementById('thumbnailReset').addEventListener('click', () => {
            mode1State.thumbnail.position = { x: 0.8, y: 0.2 };
            mode1State.thumbnail.size = 150;
            document.getElementById('thumbnailPosX').value = 80;
            document.getElementById('thumbnailPosY').value = 20;
            document.getElementById('thumbnailPosXValue').textContent = '80%';
            document.getElementById('thumbnailPosYValue').textContent = '20%';
            document.getElementById('thumbnailSize').value = 150;
            document.getElementById('thumbnailSizeValue').textContent = '150px';
            renderFront(canvas, ctx);
        });

        // 캔버스 마우스 이벤트
        canvas.addEventListener('mousedown', (e) => {
            if (mode1State.mainDesignLocked || !mode1State.design) return;

            const rect = canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
            const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);

            const tshirt = mode1State.tshirts[mode1State.currentIndex];
            const tshirtDrawParams = getTshirtDrawParams(canvas, tshirt?.image);
            if (!tshirtDrawParams) return;

            const designDrawParams = getDesignDrawParams(mode1State.design, mode1State.designPosition, mode1State.designScale, tshirtDrawParams);
            if (!designDrawParams) return;

            if (canvasX >= designDrawParams.x && canvasX <= designDrawParams.x + designDrawParams.width &&
                canvasY >= designDrawParams.y && canvasY <= designDrawParams.y + designDrawParams.height) {
                mode1State.isDragging = true;
                mode1State.dragStart = { x: canvasX, y: canvasY };
                canvas.style.cursor = 'grabbing';
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!mode1State.isDragging || mode1State.mainDesignLocked) return;

            const rect = canvas.getBoundingClientRect();
            const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
            const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);

            const deltaX = canvasX - mode1State.dragStart.x;
            const deltaY = canvasY - mode1State.dragStart.y;

            const tshirt = mode1State.tshirts[mode1State.currentIndex];
            const tshirtDrawParams = getTshirtDrawParams(canvas, tshirt?.image);
            if (!tshirtDrawParams) return;

            // 상대 좌표 업데이트
            mode1State.designPosition.x += deltaX / tshirtDrawParams.width;
            mode1State.designPosition.y += deltaY / tshirtDrawParams.height;
            
            // 경계 제한
            mode1State.designPosition.x = Math.max(0, Math.min(1, mode1State.designPosition.x));
            mode1State.designPosition.y = Math.max(0, Math.min(1, mode1State.designPosition.y));

            mode1State.dragStart = { x: canvasX, y: canvasY };
            renderFront(canvas, ctx);
        });

        canvas.addEventListener('mouseup', () => {
            mode1State.isDragging = false;
            canvas.style.cursor = mode1State.mainDesignLocked ? 'default' : 'move';
        });
    }

    // --- 렌더링 ---
    function renderFront(canvas, ctx) {
        // 렌더링 품질 설정
        if (window.TDesignUtils) {
            window.TDesignUtils.RenderQuality.setHighQuality(ctx);
        } else {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const tshirt = mode1State.tshirts[mode1State.currentIndex];
        const tshirtDrawParams = getTshirtDrawParams(canvas, tshirt?.image);
        
        if (tshirtDrawParams) {
            ctx.drawImage(tshirt.image, tshirtDrawParams.x, tshirtDrawParams.y, tshirtDrawParams.width, tshirtDrawParams.height);
        }

        if (mode1State.design) {
            const designDrawParams = getDesignDrawParams(mode1State.design, mode1State.designPosition, mode1State.designScale, tshirtDrawParams);
            if (designDrawParams) {
                ctx.drawImage(mode1State.design, designDrawParams.x, designDrawParams.y, designDrawParams.width, designDrawParams.height);
            }
        }

        if (mode1State.thumbnail.enabled) {
            renderDetailThumbnail(canvas, ctx);
        }
    }

    function renderDetailThumbnail(canvas, ctx) {
        try {
            const { size, zoomLevel, position, border } = mode1State.thumbnail;
            const halfSize = size / 2;
            
            // 품질 설정
            if (window.TDesignUtils) {
                window.TDesignUtils.RenderQuality.setHighQuality(ctx);
            } else {
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
            }
            
            // 티셔츠 영역 계산
            const tshirt = mode1State.tshirts[mode1State.currentIndex];
            if (!tshirt) return;
            
            const tshirtDrawParams = getTshirtDrawParams(canvas, tshirt.image);
            if (!tshirtDrawParams) return;
            
            // 썸네일 위치를 티셔츠 영역 내로 제한
            // position은 0-1 정규화된 값
            const maxX = tshirtDrawParams.x + tshirtDrawParams.width - size - border;
            const minX = tshirtDrawParams.x + border;
            const maxY = tshirtDrawParams.y + tshirtDrawParams.height - size - border;
            const minY = tshirtDrawParams.y + border;
            
            // 정규화된 위치를 실제 픽셀로 변환
            let thumbX = minX + (maxX - minX) * position.x;
            let thumbY = minY + (maxY - minY) * position.y;
            
            // 경계 체크
            thumbX = Math.max(minX, Math.min(maxX, thumbX));
            thumbY = Math.max(minY, Math.min(maxY, thumbY));

            ctx.save();
            // 썸네일 영역 클리핑
            ctx.beginPath();
            ctx.arc(thumbX + halfSize, thumbY + halfSize, halfSize, 0, Math.PI * 2);
            ctx.clip();

            // 썸네일 배경
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(thumbX, thumbY, size, size);

            // 고화질 썸네일을 위해 고해상도 렌더링
            if (!mode1State.design || !tshirt) { ctx.restore(); return; }
        
            // 디자인 위치 계산
            const designDrawParams = getDesignDrawParams(mode1State.design, mode1State.designPosition, mode1State.designScale, tshirtDrawParams);
            if (!designDrawParams) { ctx.restore(); return; }
            
            const centerX = designDrawParams.x + designDrawParams.width / 2;
            const centerY = designDrawParams.y + designDrawParams.height / 2;
            
            // 고해상도 임시 캔버스 생성 (4배 해상도)
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const highResScale = 4; // 4배 고해상도
            tempCanvas.width = size * highResScale;
            tempCanvas.height = size * highResScale;
            
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            
            // 배경
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 확대 렌더링
            tempCtx.save();
            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.scale(zoomLevel * highResScale, zoomLevel * highResScale);
            tempCtx.translate(-centerX, -centerY);
            
            // 티셔츠 그리기
            tempCtx.drawImage(tshirt.image, tshirtDrawParams.x, tshirtDrawParams.y, tshirtDrawParams.width, tshirtDrawParams.height);
            
            // 디자인 그리기 (원본 이미지 사용)
            const originalDesign = mode1State.originalImages.design || mode1State.design;
            tempCtx.drawImage(originalDesign, designDrawParams.x, designDrawParams.y, designDrawParams.width, designDrawParams.height);
            
            tempCtx.restore();
            
            // 고해상도를 썸네일 크기로 축소하여 그리기 (안티앨리어싱 효과)
            ctx.drawImage(
                tempCanvas,
                0, 0, tempCanvas.width, tempCanvas.height,
                thumbX, thumbY, size, size
            );

            ctx.restore();

            // 썸네일 테두리 (흰색)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = border;
            ctx.beginPath();
            ctx.arc(thumbX + halfSize, thumbY + halfSize, halfSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // 외곽선 추가 (선명하게)
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(thumbX + halfSize, thumbY + halfSize, halfSize + border/2, 0, Math.PI * 2);
            ctx.stroke();
        } catch (error) {
            console.error('Thumbnail render error:', error);
            // 썸네일 실패해도 메인 렌더링은 계속됨
        }
    }

    // 저장용 썸네일 렌더링 함수
    function renderDetailThumbnailForSave(canvas, ctx, tshirtImg, designImg) {
        if (!tshirtImg || !designImg) return;
        
        try {
            const { size, zoomLevel, position, border } = mode1State.thumbnail;
            const halfSize = size / 2;
            
            // 저장 캔버스에 맞게 스케일 조정
            const scaleRatio = canvas.width / 600; // 600은 미리보기 캔버스 너비
            const scaledSize = size * scaleRatio;
            const scaledHalfSize = scaledSize / 2;
            const scaledBorder = border * scaleRatio;
            
            // 품질 설정
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // 티셔츠 영역 계산
            const tshirtDrawParams = getTshirtDrawParams(canvas, tshirtImg);
            if (!tshirtDrawParams) return;
            
            // 썸네일 위치 계산 (정규화된 위치 사용)
            const maxX = tshirtDrawParams.x + tshirtDrawParams.width - scaledSize - scaledBorder;
            const minX = tshirtDrawParams.x + scaledBorder;
            const maxY = tshirtDrawParams.y + tshirtDrawParams.height - scaledSize - scaledBorder;
            const minY = tshirtDrawParams.y + scaledBorder;
            
            let thumbX = minX + (maxX - minX) * position.x;
            let thumbY = minY + (maxY - minY) * position.y;
            
            // 경계 체크
            thumbX = Math.max(minX, Math.min(maxX, thumbX));
            thumbY = Math.max(minY, Math.min(maxY, thumbY));
            
            ctx.save();
            
            // 원형 클리핑
            ctx.beginPath();
            ctx.arc(thumbX + scaledHalfSize, thumbY + scaledHalfSize, scaledHalfSize, 0, Math.PI * 2);
            ctx.clip();
            
            // 흰색 배경
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(thumbX, thumbY, scaledSize, scaledSize);
            
            // 고화질 썸네일을 위한 임시 캔버스 (4배 해상도)
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            const highResScale = 4;
            tempCanvas.width = scaledSize * highResScale;
            tempCanvas.height = scaledSize * highResScale;
            
            tempCtx.imageSmoothingEnabled = true;
            tempCtx.imageSmoothingQuality = 'high';
            tempCtx.fillStyle = '#ffffff';
            tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            
            // 디자인 위치 계산
            const designDrawParams = getDesignDrawParams(designImg, mode1State.designPosition, mode1State.designScale, tshirtDrawParams);
            if (!designDrawParams) { ctx.restore(); return; }
            
            const centerX = designDrawParams.x + designDrawParams.width / 2;
            const centerY = designDrawParams.y + designDrawParams.height / 2;
            
            // 고해상도로 확대 렌더링 (highResScale은 이미 위에서 선언됨)
            
            tempCtx.save();
            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.scale(zoomLevel * highResScale, zoomLevel * highResScale);
            tempCtx.translate(-centerX, -centerY);
            
            // 티셔츠 그리기
            tempCtx.drawImage(tshirtImg, tshirtDrawParams.x, tshirtDrawParams.y, tshirtDrawParams.width, tshirtDrawParams.height);
            
            // 디자인 그리기 (고화질)
            tempCtx.drawImage(designImg, designDrawParams.x, designDrawParams.y, designDrawParams.width, designDrawParams.height);
            
            tempCtx.restore();
            
            // 메인 캔버스에 그리기
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, thumbX, thumbY, scaledSize, scaledSize);
            
            ctx.restore();
            
            // 흰색 테두리
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = scaledBorder;
            ctx.beginPath();
            ctx.arc(thumbX + scaledHalfSize, thumbY + scaledHalfSize, scaledHalfSize, 0, Math.PI * 2);
            ctx.stroke();
            
            // 외곽선
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(thumbX + scaledHalfSize, thumbY + scaledHalfSize, scaledHalfSize + scaledBorder/2, 0, Math.PI * 2);
            ctx.stroke();
            
        } catch (error) {
            console.error('Save thumbnail render error:', error);
        }
    }
    
    function renderHighQuality(ctx, canvas, tshirtImg, designImg) {
        // 항상 고품질 설정 적용
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const tshirtDrawParams = getTshirtDrawParams(canvas, tshirtImg);
        if (tshirtDrawParams) {
            ctx.drawImage(tshirtImg, tshirtDrawParams.x, tshirtDrawParams.y, tshirtDrawParams.width, tshirtDrawParams.height);
        }

        if (designImg) {
            // 미리보기와 동일한 디자인 파라미터 계산
            const designDrawParams = getDesignDrawParams(
                designImg, 
                mode1State.designPosition, 
                mode1State.designScale, 
                tshirtDrawParams
            );
            
            if (designDrawParams) {
                // 디자인 그리기 (미리보기와 동일하게)
                ctx.drawImage(
                    designImg,
                    designDrawParams.x,
                    designDrawParams.y,
                    designDrawParams.width,
                    designDrawParams.height
                );
            }
        }
    }

    // --- UI 업데이트 ---
    function updateFrontTabs() {
        const tabs = document.getElementById('frontTabs');
        tabs.innerHTML = '';
        
        mode1State.tshirts.forEach((tshirt, index) => {
            const button = document.createElement('button');
            button.className = 'tab-button';
            button.textContent = tshirt.name;
            
            if (index === mode1State.currentIndex) {
                button.classList.add('active');
            }
            
            button.addEventListener('click', () => {
                mode1State.currentIndex = index;
                updateFrontTabs();
                renderFront(
                    document.getElementById('frontCanvas'),
                    document.getElementById('frontCanvas').getContext('2d')
                );
            });
            
            tabs.appendChild(button);
        });
    }

    function updateFrontFileList() {
        const list = document.getElementById('frontTshirtList');
        list.innerHTML = '';
        mode1State.tshirts.forEach(tshirt => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.textContent = tshirt.name;
            list.appendChild(item);
        });
    }

    // --- 저장 ---
    window.checkModeFrontReady = function() {
        if (mode1State.tshirts.length > 0 && mode1State.design) {
            return {
                ready: true,
                text: `📦 ${mode1State.tshirts.length}개 색상 저장`
            };
        }
        return { ready: false, text: '파일을 업로드하세요' };
    };

    window.saveModeFront = async function() {
        const files = [];
        const originalThumbnailState = mode1State.thumbnail.enabled;
        mode1State.thumbnail.enabled = false; // 저장 시 썸네일 끄기

        for (let i = 0; i < mode1State.tshirts.length; i++) {
            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            outputCanvas.width = window.outputWidth;
            outputCanvas.height = window.outputHeight;
            
            outputCtx.fillStyle = '#ffffff';
            outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
            
            const tshirt = mode1State.tshirts[i];
            // 원본 이미지 사용 (통일된 참조)
            const designImage = mode1State.originalImages.design || mode1State.design;
            renderHighQuality(outputCtx, outputCanvas, tshirt.image, designImage);

            // 저장 시 썸네일 추가 (미리보기와 동일하게)
            if (originalThumbnailState) {
                renderDetailThumbnailForSave(outputCanvas, outputCtx, tshirt.image, designImage);
            }

            const blob = await new Promise(resolve => {
                outputCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            files.push({
                name: `${tshirt.name}_front_OKSTAR.png`,
                blob
            });
        }
        
        mode1State.thumbnail.enabled = originalThumbnailState; // 썸네일 상태 복구
        await window.downloadZip(files, 'OKSTAR_Front_Output');
    };
    
    // 클린업 함수
    function cleanupMode1() {
        // 메모리 관리
        if (window.TDesignUtils) {
            // 모든 이벤트 리스너 제거
            const canvas = document.getElementById('frontCanvas');
            if (canvas) {
                window.TDesignUtils.MemoryManager.removeEventListeners(canvas);
            }
            
            // URL 정리
            mode1State.objectURLs.forEach(url => URL.revokeObjectURL(url));
            mode1State.objectURLs.clear();
        }
        
        // 상태 초기화
        mode1State.tshirts = [];
        mode1State.design = null;
        mode1State.originalImages = { design: null, tshirts: [] };
    }
    
    // 전역 노출
    window.initMode1 = initMode1;
    window.cleanupMode1 = cleanupMode1;
    
    // DOM 로드 시 초기화 - Mode 1이 기본 모드이므로 바로 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Mode 1이 활성화된 경우에만 초기화
            const container = document.getElementById('frontMode');
            if (container && container.classList.contains('active')) {
                initMode1();
            }
        });
    } else {
        // 이미 DOM이 로드된 상태라면
        const container = document.getElementById('frontMode');
        if (container && container.classList.contains('active')) {
            initMode1();
        }
    }
    
    // 페이지 언로드 시 정리
    window.addEventListener('beforeunload', cleanupMode1);
})();
