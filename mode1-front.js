// Mode 1: 앞판 전용 컴포넌트
(function() {
    'use strict';
    
    // Mode 1 상태 관리
    const mode1State = {
        tshirts: [],
        design: null,
        currentIndex: 0,
        designPosition: { x: 300, y: 200 },
        designScale: 0.3,
        isDragging: false,
        dragStart: { x: 0, y: 0 },
        
        // 디테일 확대 설정
        addDetailZoom: false,
        zoomLevel: 3,
        zoomPositionX: 85,
        zoomPositionY: 70,
        zoomFixed: true,
        
        // 디테일 영역 독립 제어
        detailAreaCenter: { x: 300, y: 200 },  // 디테일 영역 중심점
        detailOffsetX: 0,  // 디테일 영역 X 오프셋
        detailOffsetY: 0,  // 디테일 영역 Y 오프셋
        selectingDetailArea: false,
        
        // 드래그로 영역 선택
        detailSelectionStart: null,
        detailSelectionEnd: null,
        detailSelectionRect: null,
        
        // 메인 디자인 잠금
        mainDesignLocked: false,
        
        // 원본 이미지 저장
        designOriginal: null,
        tshirtOriginal: null
    };
    
    // HTML 템플릿
    const mode1HTML = `
        <div class="upload-grid single">
            <div class="upload-section">
                <div class="section-title" style="color: #3b82f6;">
                    👔 앞판 전용
                </div>
                <div class="upload-row">
                    <div>
                        <input type="file" id="frontTshirtInput" accept="image/*" multiple>
                        <label for="frontTshirtInput" class="upload-label" id="frontTshirtLabel">
                            📁 앞판 무지티셔츠 <br>
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

        <!-- 디테일 확대 컨트롤 개선 -->
        <div class="detail-control-box">
            <div class="detail-control-section">
                <div class="detail-control-title">🔍 디테일 확대 설정</div>
                
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold;">
                        <input type="checkbox" id="frontAddDetailZoom" style="margin-right: 5px;">
                        디테일 확대컷 추가
                    </label>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    <div>
                        <button id="frontSelectDetailArea" style="padding: 8px 12px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; width: 100%;">
                            🔍 확대 영역 선택
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="detail-control-section">
                <div class="detail-control-title">🎯 확대 영역 미세조정 (독립 제어)</div>
                
                <div class="control-group">
                    <span class="control-label">영역 X:</span>
                    <input type="range" id="detailOffsetX" min="-50" max="50" value="0">
                    <span class="scale-value" id="detailOffsetXValue">0px</span>
                </div>
                
                <div class="control-group">
                    <span class="control-label">영역 Y:</span>
                    <input type="range" id="detailOffsetY" min="-50" max="50" value="0">
                    <span class="scale-value" id="detailOffsetYValue">0px</span>
                </div>
                
                <div style="text-align: center; margin-top: 10px;">
                    <button id="resetDetailOffset" style="padding: 6px 12px; background: #94a3b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ↻ 오프셋 초기화
                    </button>
                </div>
            </div>
            
            <div class="detail-control-section">
                <div class="detail-control-title">📍 확대컷 표시 위치</div>
                
                <div style="text-align: center; margin-bottom: 10px;">
                    <button id="frontZoomFixBtn" style="padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                        🔒 고정
                    </button>
                    <button id="frontZoomMoveBtn" style="padding: 6px 12px; background: #94a3b8; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        🔓 이동
                    </button>
                </div>
                
                <div class="control-group">
                    <span class="control-label">가로:</span>
                    <input type="range" id="frontZoomX" min="0" max="100" value="85" disabled>
                    <span class="scale-value" id="frontZoomXValue">85%</span>
                </div>
                
                <div class="control-group">
                    <span class="control-label">세로:</span>
                    <input type="range" id="frontZoomY" min="0" max="100" value="70" disabled>
                    <span class="scale-value" id="frontZoomYValue">70%</span>
                </div>
            </div>
        </div>
    `;
    
    // 초기화 함수
    function initMode1() {
        const container = document.getElementById('frontMode');
        container.innerHTML = mode1HTML;
        
        const canvas = document.getElementById('frontCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 600;
        canvas.height = 720;
        
        // 이벤트 리스너 설정
        setupMode1Events(canvas, ctx);
        
        // appState에 mode1State 연결
        window.appState.modes.front = mode1State;
        
        // 초기 렌더링
        renderFront(canvas, ctx);
    }
    
    // 이벤트 설정
    function setupMode1Events(canvas, ctx) {
        // 티셔츠 업로드
        document.getElementById('frontTshirtInput').addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            mode1State.tshirts = [];
            mode1State.currentIndex = 0;
            
            let loadedCount = 0;
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        mode1State.tshirts.push({
                            name: file.name.split('.')[0],
                            image: img
                        });
                        
                        if (loadedCount === 0) {
                            mode1State.tshirtOriginal = img;
                        }
                        
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
            document.getElementById('frontTshirtLabel').innerHTML = 
                `✅ ${files.length}개 티셔츠<br><small>업로드 완료</small>`;
        });
        
        // 디자인 업로드
        document.getElementById('frontDesignInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    mode1State.design = img;
                    mode1State.designOriginal = img;
                    renderFront(canvas, ctx);
                    window.updateSaveButton();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            
            document.getElementById('frontDesignLabel').classList.add('uploaded');
            document.getElementById('frontDesignLabel').innerHTML = 
                `✅ 디자인<br><small>${file.name}</small>`;
        });
        
        // 크기 조절
        document.getElementById('frontScale').addEventListener('input', (e) => {
            mode1State.designScale = e.target.value / 100;
            document.getElementById('frontScaleValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });
        
        // 메인 디자인 잠금
        document.getElementById('mainDesignLock').addEventListener('change', (e) => {
            mode1State.mainDesignLocked = e.target.checked;
            canvas.style.cursor = e.target.checked ? 'default' : 'move';
        });
        
        // 디테일 확대 체크박스
        document.getElementById('frontAddDetailZoom').addEventListener('change', (e) => {
            mode1State.addDetailZoom = e.target.checked;
            renderFront(canvas, ctx);
        });
        
        // 디테일 영역 선택
        document.getElementById('frontSelectDetailArea').addEventListener('click', () => {
            mode1State.selectingDetailArea = true;
            mode1State.detailSelectionStart = null;
            mode1State.detailSelectionEnd = null;
            canvas.style.cursor = 'crosshair';
            alert('확대할 영역을 드래그하여 선택하세요');
        });
        
        // 디테일 오프셋 조절
        document.getElementById('detailOffsetX').addEventListener('input', (e) => {
            mode1State.detailOffsetX = parseInt(e.target.value);
            document.getElementById('detailOffsetXValue').textContent = e.target.value + 'px';
            renderFront(canvas, ctx);
        });
        
        document.getElementById('detailOffsetY').addEventListener('input', (e) => {
            mode1State.detailOffsetY = parseInt(e.target.value);
            document.getElementById('detailOffsetYValue').textContent = e.target.value + 'px';
            renderFront(canvas, ctx);
        });
        
        // 오프셋 초기화
        document.getElementById('resetDetailOffset').addEventListener('click', () => {
            mode1State.detailOffsetX = 0;
            mode1State.detailOffsetY = 0;
            document.getElementById('detailOffsetX').value = 0;
            document.getElementById('detailOffsetY').value = 0;
            document.getElementById('detailOffsetXValue').textContent = '0px';
            document.getElementById('detailOffsetYValue').textContent = '0px';
            renderFront(canvas, ctx);
        });
        
        // 확대컷 위치 고정/이동
        document.getElementById('frontZoomFixBtn').addEventListener('click', () => {
            mode1State.zoomFixed = true;
            document.getElementById('frontZoomFixBtn').style.background = '#3b82f6';
            document.getElementById('frontZoomMoveBtn').style.background = '#94a3b8';
            document.getElementById('frontZoomX').disabled = true;
            document.getElementById('frontZoomY').disabled = true;
        });
        
        document.getElementById('frontZoomMoveBtn').addEventListener('click', () => {
            mode1State.zoomFixed = false;
            document.getElementById('frontZoomMoveBtn').style.background = '#3b82f6';
            document.getElementById('frontZoomFixBtn').style.background = '#94a3b8';
            document.getElementById('frontZoomX').disabled = false;
            document.getElementById('frontZoomY').disabled = false;
        });
        
        // 확대컷 위치 슬라이더
        document.getElementById('frontZoomX').addEventListener('input', (e) => {
            mode1State.zoomPositionX = parseInt(e.target.value);
            document.getElementById('frontZoomXValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });
        
        document.getElementById('frontZoomY').addEventListener('input', (e) => {
            mode1State.zoomPositionY = parseInt(e.target.value);
            document.getElementById('frontZoomYValue').textContent = e.target.value + '%';
            renderFront(canvas, ctx);
        });
        
        // 캔버스 마우스 이벤트
        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // 디테일 영역 선택 모드
            if (mode1State.selectingDetailArea) {
                mode1State.detailSelectionStart = { x, y };
                mode1State.detailSelectionEnd = null;
                return;
            }
            
            // 메인 디자인 잠금 상태면 드래그 안함
            if (mode1State.mainDesignLocked) return;
            
            if (!mode1State.design) return;
            
            const width = mode1State.design.width * mode1State.designScale * 0.5;
            const height = mode1State.design.height * mode1State.designScale * 0.5;
            
            if (x >= mode1State.designPosition.x - width/2 && 
                x <= mode1State.designPosition.x + width/2 &&
                y >= mode1State.designPosition.y - height/2 && 
                y <= mode1State.designPosition.y + height/2) {
                mode1State.isDragging = true;
                mode1State.dragStart = { x, y };
                canvas.style.cursor = 'grabbing';
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) * (canvas.width / rect.width);
            const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            
            // 디테일 영역 선택 중
            if (mode1State.selectingDetailArea && mode1State.detailSelectionStart) {
                mode1State.detailSelectionEnd = { x, y };
                renderFront(canvas, ctx);
                return;
            }
            
            if (!mode1State.isDragging || mode1State.mainDesignLocked) return;
            
            mode1State.designPosition.x += x - mode1State.dragStart.x;
            mode1State.designPosition.y += y - mode1State.dragStart.y;
            mode1State.dragStart = { x, y };
            
            // 디테일 영역도 함께 이동 (기본 동작)
            if (!mode1State.addDetailZoom) {
                mode1State.detailAreaCenter = { 
                    x: mode1State.designPosition.x, 
                    y: mode1State.designPosition.y 
                };
            }
            
            renderFront(canvas, ctx);
        });
        
        canvas.addEventListener('mouseup', (e) => {
            // 디테일 영역 선택 완료
            if (mode1State.selectingDetailArea && mode1State.detailSelectionStart && mode1State.detailSelectionEnd) {
                const startX = mode1State.detailSelectionStart.x;
                const startY = mode1State.detailSelectionStart.y;
                const endX = mode1State.detailSelectionEnd.x;
                const endY = mode1State.detailSelectionEnd.y;
                
                // 선택된 영역의 중심점과 크기 계산
                const centerX = (startX + endX) / 2;
                const centerY = (startY + endY) / 2;
                const width = Math.abs(endX - startX);
                const height = Math.abs(endY - startY);
                
                // 선택된 영역 저장
                mode1State.detailAreaCenter = { x: centerX, y: centerY };
                mode1State.detailSelectionRect = { 
                    x: Math.min(startX, endX),
                    y: Math.min(startY, endY),
                    width: width,
                    height: height
                };
                
                mode1State.selectingDetailArea = false;
                mode1State.detailSelectionStart = null;
                mode1State.detailSelectionEnd = null;
                canvas.style.cursor = mode1State.mainDesignLocked ? 'default' : 'move';
                renderFront(canvas, ctx);
                return;
            }
            
            mode1State.isDragging = false;
            if (!mode1State.mainDesignLocked) {
                canvas.style.cursor = 'move';
            }
        });
    }
    
    // 메인 렌더링 함수
    function renderFront(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 티셔츠 렌더링
        const tshirt = mode1State.tshirts[mode1State.currentIndex];
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
            mode1State.tshirtOriginal = tshirt.image;
        }
        
        // 디자인 렌더링
        if (mode1State.design) {
            const width = mode1State.design.width * mode1State.designScale * 0.5;
            const height = mode1State.design.height * mode1State.designScale * 0.5;
            const x = mode1State.designPosition.x - width / 2;
            const y = mode1State.designPosition.y - height / 2;
            
            ctx.drawImage(mode1State.design, x, y, width, height);
        }
        
        // 드래그 중인 선택 영역 표시
        if (mode1State.selectingDetailArea && mode1State.detailSelectionStart && mode1State.detailSelectionEnd) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            const startX = mode1State.detailSelectionStart.x;
            const startY = mode1State.detailSelectionStart.y;
            const endX = mode1State.detailSelectionEnd.x;
            const endY = mode1State.detailSelectionEnd.y;
            
            ctx.strokeRect(
                Math.min(startX, endX),
                Math.min(startY, endY),
                Math.abs(endX - startX),
                Math.abs(endY - startY)
            );
            ctx.setLineDash([]);
        }
        
        // 디테일 확대 표시
        if (mode1State.addDetailZoom && mode1State.detailSelectionRect) {
            const detailRect = mode1State.detailSelectionRect;
            const detailX = detailRect.x + mode1State.detailOffsetX;
            const detailY = detailRect.y + mode1State.detailOffsetY;
            const detailWidth = detailRect.width;
            const detailHeight = detailRect.height;
            
            // 확대 미리보기
            const zoomSize = 150;
            const zoomX = (canvas.width - zoomSize) * (mode1State.zoomPositionX / 100);
            const zoomY = (canvas.height - zoomSize) * (mode1State.zoomPositionY / 100);
            
            ctx.save();
            
            // 원형 클리핑 영역 설정
            ctx.beginPath();
            ctx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
            ctx.clip();
            
            // 흰색 배경
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(zoomX, zoomY, zoomSize, zoomSize);
            
            // 고화질 렌더링을 위한 임시 캔버스
            if (detailWidth > 0 && detailHeight > 0 && tshirt && tshirt.image && mode1State.designOriginal) {
                // 고해상도 임시 캔버스 생성
                const hdCanvas = document.createElement('canvas');
                hdCanvas.width = 1500;
                hdCanvas.height = 1500;
                const hdCtx = hdCanvas.getContext('2d');
                
                // HD 캔버스에 고화질로 렌더링
                renderForSave(hdCtx, hdCanvas, tshirt.image, mode1State.designOriginal);
                
                // HD 캔버스에서의 실제 좌표 계산
                const hdScale = hdCanvas.width / canvas.width;
                const hdX = detailX * hdScale;
                const hdY = detailY * hdScale;
                const hdWidth = detailWidth * hdScale;
                const hdHeight = detailHeight * hdScale;
                
                // 원본 비율 계산
                const aspectRatio = detailWidth / detailHeight;
                
                // 원형 안에서 비율을 유지하면서 최대 크기 계산
                let drawWidth, drawHeight, drawX, drawY;
                
                if (aspectRatio > 1) {
                    drawWidth = zoomSize;
                    drawHeight = zoomSize / aspectRatio;
                    drawX = zoomX;
                    drawY = zoomY + (zoomSize - drawHeight) / 2;
                } else {
                    drawHeight = zoomSize;
                    drawWidth = zoomSize * aspectRatio;
                    drawX = zoomX + (zoomSize - drawWidth) / 2;
                    drawY = zoomY;
                }
                
                // 고화질 소스에서 확대 영역 추출
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(
                    hdCanvas,
                    hdX,
                    hdY,
                    hdWidth,
                    hdHeight,
                    drawX,
                    drawY,
                    drawWidth,
                    drawHeight
                );
            }
            
            ctx.restore();
            
            // 원형 테두리
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // 고화질 저장용 렌더링 함수
    function renderForSave(ctx, canvas, tshirtImg, designImg) {
        // 캔버스 클리어
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 스케일 비율 계산
        const scaleRatio = canvas.width / 600;
        
        // 티셔츠 렌더링
        if (tshirtImg) {
            const scale = Math.min(
                canvas.width / tshirtImg.width,
                canvas.height / tshirtImg.height
            ) * 0.9;
            
            const width = tshirtImg.width * scale;
            const height = tshirtImg.height * scale;
            const x = (canvas.width - width) / 2;
            const y = (canvas.height - height) / 2;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(tshirtImg, x, y, width, height);
        }
        
        // 디자인 렌더링
        if (designImg) {
            const width = designImg.width * mode1State.designScale * scaleRatio * 0.5;
            const height = designImg.height * mode1State.designScale * scaleRatio * 0.5;
            
            const x = (mode1State.designPosition.x * scaleRatio) - width / 2;
            const y = (mode1State.designPosition.y * scaleRatio) - height / 2;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(designImg, x, y, width, height);
        }
    }
    
    // 탭 업데이트
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
    
    // 파일 리스트 업데이트
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
    
    // 저장 가능 체크
    window.checkModeFrontReady = function() {
        if (mode1State.tshirts.length > 0 && mode1State.design) {
            return {
                ready: true,
                text: `📦 ${mode1State.tshirts.length}개 색상 저장`
            };
        }
        return { ready: false, text: '파일을 업로드하세요' };
    };
    
    // 저장 함수
    window.saveModeFront = async function() {
        const files = [];
        
        for (let i = 0; i < mode1State.tshirts.length; i++) {
            const outputCanvas = document.createElement('canvas');
            const outputCtx = outputCanvas.getContext('2d');
            outputCanvas.width = window.outputWidth;
            outputCanvas.height = window.outputHeight;
            
            const tshirt = mode1State.tshirts[i];
            
            // 메인 이미지 렌더링
            renderForSave(outputCtx, outputCanvas, tshirt.image, mode1State.designOriginal);
            
            // 디테일 확대 추가
            if (mode1State.addDetailZoom && mode1State.detailSelectionRect && tshirt.image && mode1State.designOriginal) {
                const detailRect = mode1State.detailSelectionRect;
                const detailX = detailRect.x + mode1State.detailOffsetX;
                const detailY = detailRect.y + mode1State.detailOffsetY;
                const detailWidth = detailRect.width;
                const detailHeight = detailRect.height;
                
                const zoomSize = 400;
                const zoomX = (window.outputWidth - zoomSize) * (mode1State.zoomPositionX / 100);
                const zoomY = (window.outputHeight - zoomSize) * (mode1State.zoomPositionY / 100);
                
                // 임시 캔버스 생성하여 완전한 이미지 렌더링
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = window.outputWidth;
                tempCanvas.height = window.outputHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                // 임시 캔버스에 티셔츠 + 디자인 렌더링
                renderForSave(tempCtx, tempCanvas, tshirt.image, mode1State.designOriginal);
                
                // 원형 클리핑 영역 설정
                outputCtx.save();
                outputCtx.beginPath();
                outputCtx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
                outputCtx.clip();
                
                // 흰색 배경
                outputCtx.fillStyle = '#ffffff';
                outputCtx.fillRect(zoomX, zoomY, zoomSize, zoomSize);
                
                // 선택된 영역을 비율 유지하면서 확대
                const scaleRatio = window.outputWidth / 600;
                const sourceX = detailX * scaleRatio;
                const sourceY = detailY * scaleRatio;
                const sourceWidth = detailWidth * scaleRatio;
                const sourceHeight = detailHeight * scaleRatio;
                
                if (sourceWidth > 0 && sourceHeight > 0) {
                    // 원본 비율 계산
                    const aspectRatio = sourceWidth / sourceHeight;
                    
                    // 원형 안에서 비율을 유지하면서 최대 크기 계산
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    if (aspectRatio > 1) {
                        // 가로가 더 긴 경우
                        drawWidth = zoomSize;
                        drawHeight = zoomSize / aspectRatio;
                        drawX = zoomX;
                        drawY = zoomY + (zoomSize - drawHeight) / 2;
                    } else {
                        // 세로가 더 길거나 같은 경우
                        drawHeight = zoomSize;
                        drawWidth = zoomSize * aspectRatio;
                        drawX = zoomX + (zoomSize - drawWidth) / 2;
                        drawY = zoomY;
                    }
                    
                    outputCtx.imageSmoothingEnabled = true;
                    outputCtx.imageSmoothingQuality = 'high';
                    outputCtx.drawImage(
                        tempCanvas,
                        sourceX,
                        sourceY,
                        sourceWidth,
                        sourceHeight,
                        drawX,
                        drawY,
                        drawWidth,
                        drawHeight
                    );
                }
                
                outputCtx.restore();
                
                // 테두리
                outputCtx.strokeStyle = '#e2e8f0';
                outputCtx.lineWidth = 2;
                outputCtx.beginPath();
                outputCtx.arc(zoomX + zoomSize/2, zoomY + zoomSize/2, zoomSize/2, 0, Math.PI * 2);
                outputCtx.stroke();
            }
            
            const blob = await new Promise(resolve => {
                outputCanvas.toBlob(resolve, 'image/png', 1.0);
            });
            
            files.push({
                name: `${tshirt.name}_front_OKSTAR.png`,
                blob
            });
        }
        
        await window.downloadZip(files, 'OKSTAR_Front_Output');
    };
    
    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMode1);
    } else {
        initMode1();
    }
})();