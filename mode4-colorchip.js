// Mode 4: 컬러칩 제작 컴포넌트
(function() {
    'use strict';
    
    // Mode 4 상태 관리
    const mode4State = {
        images: [],
        texts: [],
        columns: 3,
        settings: {
            width: 1500,
            fontSize: 12,
            textColor: '#000000',
            imageGap: 10,
            textGap: 8,
            padding: 20,
            textAlign: 'center'
        }
    };
    
    // 컬러칩 기본 프리셋
    const colorchipPreset = [
        'BLACK', 'GRAY', 'NAVY', 'WHITE', 'DARK GREEN',
        'KHAKI', 'DEEP BLUE', 'LIGHT GRAY', 'CREAM', 
        'LIGHT BEIGE', 'OATMEAL', 'CHARCOAL', 'BURGUNDY',
        'OLIVE', 'SAND', 'MINT', 'CORAL', 'LAVENDER',
        'RUST', 'TEAL'
    ];
    
    // HTML 템플릿
    const mode4HTML = `
        <style>
            .colorchip-grid {
                display: grid;
                gap: 10px;
                margin: 20px 0;
                padding: 20px;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
            }
            
            .colorchip-item {
                text-align: center;
            }
            
            .colorchip-image {
                width: 100%;
                aspect-ratio: 1;
                object-fit: cover;
                border-radius: 5px;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
            }
            
            .colorchip-text {
                margin-top: 8px;
                padding: 5px;
                border: 1px solid transparent;
                background: transparent;
                text-align: center;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
                width: 100%;
            }
            
            .colorchip-text:hover,
            .colorchip-text:focus {
                border-color: #3b82f6;
                background: #f0f9ff;
                outline: none;
            }
            
            .advanced-settings {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #e2e8f0;
            }
            
            .advanced-toggle {
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 14px;
                font-weight: 600;
                color: #475569;
                user-select: none;
            }
            
            .advanced-content {
                display: none;
                margin-top: 15px;
            }
            
            .advanced-content.show {
                display: block;
            }
            
            .batch-edit-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                justify-content: center;
                align-items: center;
            }
            
            .batch-edit-modal.show {
                display: flex;
            }
            
            .batch-edit-content {
                background: white;
                border-radius: 15px;
                padding: 25px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .batch-edit-item {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
            }
            
            .batch-edit-item label {
                min-width: 30px;
                font-weight: 600;
                color: #475569;
            }
            
            .batch-edit-item input {
                flex: 1;
                padding: 8px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 14px;
            }
            
            .colorchip-controls {
                background: #f8fafc;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 20px;
            }
        </style>
        
        <div class="colorchip-controls">
            <div style="text-align: center; margin-bottom: 20px;">
                <input type="file" id="colorchipInput" accept="image/*" multiple style="display: none;">
                <label for="colorchipInput" class="upload-label" style="display: inline-block; width: 300px; padding: 20px;">
                    📁 이미지 업로드<br>
                    <small>최대 20개 선택 가능</small>
                    <div id="colorchipUploadStatus" style="margin-top: 10px; font-weight: bold;"></div>
                </label>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">가로 크기:</label>
                    <input type="number" id="colorchipWidth" value="1500" 
                           style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">열 개수:</label>
                    <div style="display: flex; gap: 10px;">
                        <button class="position-btn" data-cols="2">2개</button>
                        <button class="position-btn active" data-cols="3">3개</button>
                        <button class="position-btn" data-cols="4">4개</button>
                        <button class="position-btn" data-cols="5">5개</button>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">텍스트 크기:</label>
                    <select id="colorchipFontSize" 
                            style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <option value="10">10px</option>
                        <option value="12" selected>12px</option>
                        <option value="14">14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                        <option value="20">20px</option>
                    </select>
                </div>
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">텍스트 색상:</label>
                    <select id="colorchipTextColor" 
                            style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        <option value="#000000">검정</option>
                        <option value="#666666">회색</option>
                        <option value="#333333">진회색</option>
                        <option value="#1f2937">다크그레이</option>
                        <option value="#3b82f6">파란색</option>
                    </select>
                </div>
            </div>

            <div style="text-align: center; margin-top: 15px;">
                <button id="colorchipBatchEdit" 
                        style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                    ✏️ 텍스트 일괄 편집
                </button>
                <button id="colorchipReset" 
                        style="padding: 10px 20px; background: #94a3b8; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                    ↻ 기본값으로 리셋
                </button>
                <button id="colorchipAutoName" 
                        style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                    🎨 자동 색상명 생성
                </button>
            </div>

            <!-- 고급 설정 -->
            <div class="advanced-settings">
                <div class="advanced-toggle" onclick="window.toggleAdvanced()">
                    <span id="advancedArrow">▶</span> 고급 설정
                </div>
                <div id="advancedContent" class="advanced-content">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">이미지 간격:</label>
                            <input type="number" id="colorchipImageGap" value="10" min="0" max="50" 
                                   style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">텍스트 간격:</label>
                            <input type="number" id="colorchipTextGap" value="8" min="0" max="20" 
                                   style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">외부 여백:</label>
                            <input type="number" id="colorchipPadding" value="20" min="0" max="100" 
                                   style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        </div>
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">텍스트 정렬:</label>
                            <select id="colorchipTextAlign" 
                                    style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                <option value="center">중앙</option>
                                <option value="left">왼쪽</option>
                                <option value="right">오른쪽</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">이미지 테두리:</label>
                            <select id="colorchipBorder" 
                                    style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
                                <option value="none">없음</option>
                                <option value="thin">얇게</option>
                                <option value="normal">보통</option>
                                <option value="thick">두껍게</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 5px;">배경색:</label>
                            <input type="color" id="colorchipBackground" value="#ffffff" 
                                   style="width: 100%; height: 38px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 6px;">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 미리보기 -->
        <div id="colorchipPreview" class="colorchip-grid" style="grid-template-columns: repeat(3, 1fr);"></div>
        
        <!-- 캔버스 (숨김) -->
        <canvas id="colorchipCanvas" style="display: none;"></canvas>
        
        <!-- 텍스트 일괄 편집 모달 -->
        <div id="batchEditModal" class="batch-edit-modal">
            <div class="batch-edit-content">
                <h3 style="margin-bottom: 20px;">텍스트 일괄 편집</h3>
                <div id="batchEditList"></div>
                <div style="text-align: center; margin-top: 20px;">
                    <button onclick="window.applyBatchEdit()" 
                            style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        적용
                    </button>
                    <button onclick="window.closeBatchEdit()" 
                            style="padding: 10px 20px; background: #94a3b8; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        취소
                    </button>
                    <button onclick="window.resetToDefault()" 
                            style="padding: 10px 20px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                        기본값
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 초기화 함수
    function initMode4() {
        const container = document.getElementById('colorchipMode');
        container.innerHTML = mode4HTML;
        
        // 이벤트 리스너 설정
        setupMode4Events();
        
        // appState에 연결
        window.appState.modes.colorchip = mode4State;
    }
    
    // 이벤트 설정
    function setupMode4Events() {
        const fileInput = document.getElementById('colorchipInput');
        const preview = document.getElementById('colorchipPreview');
        const canvas = document.getElementById('colorchipCanvas');
        const ctx = canvas.getContext('2d');
        
        // 파일 업로드
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files).slice(0, 20);
            mode4State.images = [];
            mode4State.texts = [];
            
            let loadedCount = 0;
            files.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.onload = () => {
                        mode4State.images[index] = img;
                        
                        // 기본 프리셋 텍스트 설정
                        if (index < colorchipPreset.length) {
                            mode4State.texts[index] = colorchipPreset[index];
                        } else {
                            mode4State.texts[index] = `Color ${index + 1}`;
                        }
                        
                        loadedCount++;
                        if (loadedCount === files.length) {
                            updateColorchipPreview();
                            window.updateSaveButton();
                            document.getElementById('colorchipUploadStatus').textContent = 
                                `${files.length}개 업로드 완료`;
                        }
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
        });
        
        // 열 개수 버튼
        document.querySelectorAll('[data-cols]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('[data-cols]').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                mode4State.columns = parseInt(e.target.dataset.cols);
                updateColorchipPreview();
            });
        });
        
        // 설정 변경 이벤트
        const settingInputs = [
            'colorchipWidth', 'colorchipFontSize', 'colorchipTextColor',
            'colorchipImageGap', 'colorchipTextGap', 'colorchipPadding', 
            'colorchipTextAlign', 'colorchipBorder', 'colorchipBackground'
        ];
        
        settingInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    updateColorchipSettings();
                    updateColorchipPreview();
                });
            }
        });
        
        // 일괄 편집
        document.getElementById('colorchipBatchEdit').addEventListener('click', openBatchEdit);
        
        // 리셋
        document.getElementById('colorchipReset').addEventListener('click', () => {
            mode4State.texts.forEach((_, index) => {
                if (index < colorchipPreset.length) {
                    mode4State.texts[index] = colorchipPreset[index];
                } else {
                    mode4State.texts[index] = `Color ${index + 1}`;
                }
            });
            updateColorchipPreview();
        });
        
        // 자동 색상명 생성
        document.getElementById('colorchipAutoName').addEventListener('click', () => {
            mode4State.images.forEach((img, index) => {
                const colorName = analyzeImageColor(img);
                mode4State.texts[index] = colorName;
            });
            updateColorchipPreview();
        });
    }
    
    // 이미지 색상 분석 (간단한 버전)
    function analyzeImageColor(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 50;
        canvas.height = 50;
        
        ctx.drawImage(img, 0, 0, 50, 50);
        const imageData = ctx.getImageData(25, 25, 1, 1);
        const [r, g, b] = imageData.data;
        
        // 간단한 색상 판별
        if (r > 200 && g > 200 && b > 200) return 'WHITE';
        if (r < 50 && g < 50 && b < 50) return 'BLACK';
        if (r > 150 && g < 100 && b < 100) return 'RED';
        if (r < 100 && g > 150 && b < 100) return 'GREEN';
        if (r < 100 && g < 100 && b > 150) return 'BLUE';
        if (r > 150 && g > 150 && b < 100) return 'YELLOW';
        if (r > 100 && g < 50 && b > 100) return 'PURPLE';
        if (r > 200 && g > 150 && b > 100) return 'BEIGE';
        if (r > 100 && g > 100 && b > 100) return 'GRAY';
        
        return 'CUSTOM';
    }
    
    // 설정 업데이트
    function updateColorchipSettings() {
        mode4State.settings.width = parseInt(document.getElementById('colorchipWidth').value);
        mode4State.settings.fontSize = parseInt(document.getElementById('colorchipFontSize').value);
        mode4State.settings.textColor = document.getElementById('colorchipTextColor').value;
        mode4State.settings.imageGap = parseInt(document.getElementById('colorchipImageGap').value);
        mode4State.settings.textGap = parseInt(document.getElementById('colorchipTextGap').value);
        mode4State.settings.padding = parseInt(document.getElementById('colorchipPadding').value);
        mode4State.settings.textAlign = document.getElementById('colorchipTextAlign').value;
        mode4State.settings.border = document.getElementById('colorchipBorder')?.value || 'none';
        mode4State.settings.background = document.getElementById('colorchipBackground')?.value || '#ffffff';
    }
    
    // 미리보기 업데이트
    function updateColorchipPreview() {
        const preview = document.getElementById('colorchipPreview');
        preview.innerHTML = '';
        preview.style.gridTemplateColumns = `repeat(${mode4State.columns}, 1fr)`;
        
        mode4State.images.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'colorchip-item';
            
            const imgEl = document.createElement('img');
            imgEl.src = img.src;
            imgEl.className = 'colorchip-image';
            
            const textEl = document.createElement('input');
            textEl.type = 'text';
            textEl.className = 'colorchip-text';
            textEl.value = mode4State.texts[index] || '';
            textEl.style.fontSize = mode4State.settings.fontSize + 'px';
            textEl.style.color = mode4State.settings.textColor;
            textEl.style.textAlign = mode4State.settings.textAlign;
            
            textEl.addEventListener('input', (e) => {
                mode4State.texts[index] = e.target.value;
            });
            
            item.appendChild(imgEl);
            item.appendChild(textEl);
            preview.appendChild(item);
        });
    }
    
    // 일괄 편집 모달
    function openBatchEdit() {
        const modal = document.getElementById('batchEditModal');
        const list = document.getElementById('batchEditList');
        
        list.innerHTML = '';
        mode4State.texts.forEach((text, index) => {
            const item = document.createElement('div');
            item.className = 'batch-edit-item';
            item.innerHTML = `
                <label>${index + 1}.</label>
                <input type="text" value="${text}" data-index="${index}">
            `;
            list.appendChild(item);
        });
        
        modal.classList.add('show');
    }
    
    // 전역 함수들 (window에 등록)
    window.toggleAdvanced = function() {
        const content = document.getElementById('advancedContent');
        const arrow = document.getElementById('advancedArrow');
        
        content.classList.toggle('show');
        arrow.textContent = content.classList.contains('show') ? '▼' : '▶';
    };
    
    window.closeBatchEdit = function() {
        document.getElementById('batchEditModal').classList.remove('show');
    };
    
    window.applyBatchEdit = function() {
        const inputs = document.querySelectorAll('#batchEditList input');
        inputs.forEach(input => {
            const index = parseInt(input.dataset.index);
            mode4State.texts[index] = input.value;
        });
        
        window.closeBatchEdit();
        updateColorchipPreview();
    };
    
    window.resetToDefault = function() {
        const list = document.getElementById('batchEditList');
        const inputs = list.querySelectorAll('input');
        
        inputs.forEach((input, index) => {
            if (index < colorchipPreset.length) {
                input.value = colorchipPreset[index];
            } else {
                input.value = `Color ${index + 1}`;
            }
        });
    };
    
    // 저장 가능 체크
    window.checkModeColorchipReady = function() {
        if (mode4State.images.length > 0) {
            return {
                ready: true,
                text: `🎨 컬러칩 저장 (${mode4State.images.length}개)`
            };
        }
        return { ready: false, text: '파일을 업로드하세요' };
    };
    
    // 저장 함수
    window.saveModeColorchip = async function() {
        const settings = mode4State.settings;
        const columns = mode4State.columns;
        const images = mode4State.images;
        const texts = mode4State.texts;
        
        if (images.length === 0) return;
        
        const canvas = document.getElementById('colorchipCanvas');
        const ctx = canvas.getContext('2d');
        
        const rows = Math.ceil(images.length / columns);
        const imageSize = (settings.width - settings.padding * 2 - settings.imageGap * (columns - 1)) / columns;
        const textHeight = settings.fontSize + settings.textGap;
        const rowHeight = imageSize + textHeight + 20;
        const canvasHeight = settings.padding * 2 + rowHeight * rows + settings.imageGap * (rows - 1);
        
        canvas.width = settings.width;
        canvas.height = canvasHeight;
        
        // 배경
        ctx.fillStyle = settings.background || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 이미지와 텍스트 그리기
        images.forEach((img, index) => {
            const col = index % columns;
            const row = Math.floor(index / columns);
            
            const x = settings.padding + col * (imageSize + settings.imageGap);
            const y = settings.padding + row * (rowHeight + settings.imageGap);
            
            // 이미지 그리기 (정사각형 크롭)
            const srcSize = Math.min(img.width, img.height);
            const srcX = (img.width - srcSize) / 2;
            const srcY = (img.height - srcSize) / 2;
            
            // 테두리
            if (settings.border && settings.border !== 'none') {
                const borderWidth = settings.border === 'thin' ? 1 : 
                                   settings.border === 'thick' ? 3 : 2;
                ctx.strokeStyle = '#e2e8f0';
                ctx.lineWidth = borderWidth;
                ctx.strokeRect(x, y, imageSize, imageSize);
            }
            
            ctx.drawImage(img, srcX, srcY, srcSize, srcSize, x, y, imageSize, imageSize);
            
            // 텍스트 그리기
            ctx.fillStyle = settings.textColor;
            ctx.font = `600 ${settings.fontSize}px -apple-system, "Noto Sans KR", sans-serif`;
            ctx.textAlign = settings.textAlign;
            
            let textX = x;
            if (settings.textAlign === 'center') textX = x + imageSize / 2;
            else if (settings.textAlign === 'right') textX = x + imageSize;
            
            const textY = y + imageSize + settings.textGap + settings.fontSize;
            ctx.fillText(texts[index] || '', textX, textY);
        });
        
        // 다운로드
        canvas.toBlob((blob) => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            a.download = `colorchip_${date}_OKSTAR.png`;
            a.click();
            window.showSaveSuccess('컬러칩 저장 완료!');
        }, 'image/png', 1.0);
    };
    
    // DOM 로드 시 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMode4);
    } else {
        initMode4();
    }
})();