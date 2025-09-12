

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const vi = {
  appName: 'Pika-AI',
  errorAnErrorOccurred: 'Đã xảy ra lỗi',
  errorTryAgain: 'Thử lại',
  errorNoImageLoaded: 'Chưa có ảnh để chỉnh sửa.',
  errorNoImageLoadedToFilter: 'Chưa có ảnh để áp dụng bộ lọc.',
  errorNoImageLoadedToAdjust: 'Chưa có ảnh để áp dụng điều chỉnh.',
  errorNoImageLoadedToExpand: 'Chưa có ảnh để mở rộng.',
  errorFailedToApplyFilter: 'Không thể áp dụng bộ lọc.',
  errorFailedToApplyAdjustment: 'Không thể áp dụng điều chỉnh.',
  errorFailedToExpandImage: 'Không thể mở rộng ảnh.',
  errorPleaseSelectCrop: 'Vui lòng chọn một vùng để cắt.',
  errorCouldNotProcessCrop: 'Không thể xử lý việc cắt ảnh.',
  errorImageStillLoading: 'Ảnh vẫn đang tải. Vui lòng đợi một lát và thử lại.',
  errorCouldNotFindImage: 'Không tìm thấy ảnh để tải xuống.',
  errorCouldNotProcessDownload: 'Không thể tạo canvas để xử lý việc tải xuống.',
  errorImageLoadForDownload: 'Ảnh không thể tải để xử lý việc tải xuống.',
  errorDownloadTainted: 'Lỗi bảo mật đã ngăn chặn việc tải xuống. Ảnh có thể từ một tên miền khác.',
  errorEnterDescription: 'Vui lòng nhập mô tả về chỉnh sửa bạn muốn thực hiện.',
  errorSelectArea: 'Vui lòng chọn một vùng trên ảnh để chỉnh sửa bằng cách nhấp vào nó.',
  errorNoMask: 'Vui lòng vẽ một vùng chọn trên ảnh bằng công cụ cọ vẽ.',
  errorFailedToGenerate: 'Không thể tạo ảnh đã chỉnh sửa.',
  errorFailedToExtract: 'Không thể trích xuất vật thể.',
  errorFailedToCleanBackground: 'Không thể xóa người khỏi ảnh nền.',
  errorRateLimit: 'Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một lát và thử lại.',
  errorFailedToExport: 'Không thể xuất tài liệu.',
  errorFaceSwapValidation: 'Vui lòng chọn một khuôn mặt từ cả ảnh chính và ảnh để hoán đổi.',
  faceSwapDefaultPrompt: `**NHIỆM VỤ AI: GIAO THỨC TÍCH HỢP ĐỘNG & NHẬN THỨC NGỮ CẢNH CHO VIỆC HOÁN ĐỔI KHUÔN MẶT v10.0**

**VAI TRÒ:** Bạn là một chuyên gia chỉnh sửa ảnh AI chuyên về hoán đổi khuôn mặt siêu thực, không thể bị phát hiện. Nhiệm vụ của bạn là thực hiện giao thức sau với độ chính xác tuyệt đối.

**GIAO THỨC THỰC HIỆN (Thứ tự nghiêm ngặt):**

**BƯỚC 1: PHÂN TÍCH ĐẦU VÀO**
-   **Ảnh gốc:** Bức ảnh chính nơi khuôn mặt sẽ được đặt vào.
-   **Ảnh khuôn mặt nguồn:** Ảnh chứa khuôn mặt mới sẽ được cấy ghép.
-   **Mặt nạ:** Vùng mục tiêu chính xác trên ảnh gốc.

**BƯỚC 2: CẤY GHÉP VÀ BẢO TOÀN DANH TÍNH PHÁP Y (KHÔNG THỂ THƯƠNG LƯỢNG)**
-   **Hành động:** Cấy ghép Khuôn mặt nguồn vào vùng được che bởi mặt nạ của ảnh gốc.
-   **CHỈ THỊ QUAN TRỌNG NHẤT:** Bạn **PHẢI** tuân thủ các quy tắc bảo toàn danh tính tuyệt đối sau đây. Đây là ưu tiên cao nhất của bạn. Bất kỳ sự sai lệch nào cũng là một thất bại nghiêm trọng.
    -   **Quy tắc 2.1 (Danh tính & Cấu trúc khuôn mặt):** Khuôn mặt mới **PHẢI** giữ lại **DANH TÍNH CHÍNH XÁC VÀ CÁC ĐẶC ĐIỂM ĐỘC ĐÁO** của người trong ảnh khuôn mặt nguồn. Bạn bị **NGHIÊM CẤM** làm đẹp, lý tưởng hóa, hoặc làm cho khuôn mặt cân đối hơn. Bạn **PHẢI** bảo tồn hoàn hảo tất cả các đặc điểm bất đối xứng tự nhiên (ví dụ: \`mặt lệch\`, \`miệng lệch\`).
    -   **Quy tắc 2.2 (Thuộc tính vật lý):** Bảo tồn cân nặng cảm nhận được, hình dáng cơ thể, và hình dạng khuôn mặt (mặt to/nhỏ).
    -   **Quy tắc 2.3 (Bảo tồn đặc điểm pháp y):** Bạn **PHẢI** bảo tồn hoàn hảo tất cả các đặc điểm độc đáo, xác định từ **KHUÔN MẶT NGUỒN**. Điều này không thể thương lượng và bao gồm:
        -   **Cấu trúc răng:** Bảo tồn các răng độc đáo, chẳng hạn như răng khểnh, răng hô. **KHÔNG** được "sửa chữa" răng.
        -   **Hình dạng mắt:** Bảo tồn chính xác hình dạng mắt ban đầu, cho dù là mắt một mí, mắt hai mí, hay mắt híp. **KHÔNG** được làm mắt to hơn hay thay đổi hình dạng.
        -   **Hình dạng mũi:** Bảo tồn hình dạng mũi gốc (cao, tẹt, to).
        -   **Các đặc điểm khác:** Nốt ruồi, sẹo, nếp nhăn, núm đồng tiền **PHẢI** được chuyển giao và bảo tồn hoàn hảo.
    -   **Quy tắc 2.4 (Biểu cảm & "Linh hồn"):** **BIỂU CẢM** và các "vi biểu cảm" tinh tế từ khuôn mặt nguồn PHẢI được bảo tồn để giữ lại "linh hồn" và tính cách của người đó, miễn là nó phù hợp với bối cảnh chung của cảnh.

**BƯỚC 3: TÍCH HỢP ĐỘNG & NHẬN THỨC NGỮ CẢNH**
-   **Hành động:** Tích hợp khuôn mặt được cấy ghép một cách liền mạch vào môi trường ảnh gốc bằng cách sử dụng mô phỏng vật lý nâng cao.
-   **CHỈ THỊ:** Phân tích nguồn sáng, màu sắc và môi trường của ảnh gốc. Điều chỉnh tỉ mỉ các thuộc tính của khuôn mặt đã hoán đổi để hoàn toàn khớp với môi trường:
    -   **Ánh sáng & Bóng đổ:** Ánh sáng phải chiếu lên khuôn mặt mới một cách tự nhiên, tạo ra các điểm sáng và bóng đổ chính xác.
    -   **Phản chiếu Môi trường:** Màu sắc từ môi trường xung quanh phải phản chiếu một cách tinh tế lên da, mắt và các bề mặt bóng (như kính).
    -   **Kết cấu & Nhiễu hạt:** Kết cấu da (giữ lại lỗ chân lông) và nhiễu hạt của ảnh phải khớp hoàn hảo với ảnh gốc.
    -   **Góc đầu & Ánh mắt:** Phải khớp với cơ thể và bối cảnh của ảnh gốc.

**BƯỚC 4: ĐẦU RA CUỐI CÙNG**
-   **Hành động:** Chỉ trả về bức ảnh đã chỉnh sửa cuối cùng.`,
  errorNoFaceInMain: 'Không thể phát hiện bất kỳ khuôn mặt nào trong ảnh chính để sử dụng làm mục tiêu.',
  startScreenTitle: 'Chỉnh sửa ảnh bằng AI, {simplified}.',
  startScreenTitleSimplified: 'Đơn giản hóa',
  startScreenDescription: 'Chỉnh sửa ảnh, áp dụng các bộ lọc sáng tạo, hoặc thực hiện các điều chỉnh chuyên nghiệp bằng các câu lệnh văn bản đơn giản. Không cần công cụ phức tạp.',
  uploadImage: 'Tải ảnh lên',
  dragAndDrop: 'hoặc kéo và thả một tệp',
  feature1Title: 'Chỉnh sửa chính xác',
  feature1Desc: 'Nhấp vào bất kỳ điểm nào trên ảnh của bạn để xóa khuyết điểm, thay đổi màu sắc hoặc thêm các yếu tố với độ chính xác cao.',
  feature2Title: 'Bộ lọc sáng tạo',
  feature2Desc: 'Biến đổi ảnh với các phong cách nghệ thuật. Từ vẻ ngoài cổ điển đến ánh sáng tương lai, hãy tìm hoặc tạo bộ lọc hoàn hảo.',
  feature3Title: 'Điều chỉnh chuyên nghiệp',
  feature3Desc: 'Tăng cường ánh sáng, làm mờ hậu cảnh hoặc thay đổi tâm trạng. Đạt được kết quả chất lượng studio mà không cần các công cụ phức tạp.',
  loadingTextDefault: 'AI đang thể hiện phép màu...',
  loadingRetouch: 'Đang phân tích lựa chọn của bạn và áp dụng chỉnh sửa sáng tạo...',
  loadingFilter: 'Đang kết xuất ảnh với bộ lọc sáng tạo mới...',
  loadingAdjustment: 'Đang xử lý các điều chỉnh về ánh sáng và màu sắc...',
  loadingIdPhoto: 'Đang tạo ảnh thẻ tuân thủ với các tùy chọn đã chỉ định...',
  loadingExpansion: 'Đang mở rộng khung vẽ và tạo nội dung mới...',
  loadingComposite: 'Đang tạo các biến thể...',
  loadingFaceSwap: 'Đang thực hiện hoán đổi khuôn mặt siêu thực...',
  loadingCleanBackground: 'Đang xóa người và tái tạo hậu cảnh...',
  loadingExtract: 'Đang xác định và trích xuất mục đã chỉ định...',
  loadingScan: 'Đang quét và nâng cao tài liệu...',
  tabRetouch: 'Chỉnh sửa',
  tabCrop: 'Cắt ảnh',
  tabAdjust: 'Nâng cao',
  tabFilters: 'Bộ lọc',
  tabExpand: 'Mở rộng',
  tabInsert: 'Ghép ảnh',
  tabScan: 'Quét',
  tabFaceSwap: 'Hoán đổi khuôn mặt',
  tabStudio: 'Studio',
  tabIdPhoto: 'Ảnh thẻ',
  tooltipRetouch: 'Chỉnh sửa',
  tooltipCrop: 'Cắt ảnh',
  tooltipAdjust: 'Nâng cao bằng AI',
  tooltipFilters: 'Bộ lọc',
  tooltipExpand: 'Mở rộng',
  tooltipInsert: 'Ghép ảnh & Hoán đổi khuôn mặt',
  tooltipScan: 'Quét tài liệu',
  tooltipIdPhoto: 'Ảnh thẻ',
  tooltipExtract: 'Trích xuất vật thể',
  tooltipFaceSwap: 'Hoán đổi khuôn mặt',
  tooltipStudio: 'Chế độ Studio',
  retouchTitle: 'Chỉnh sửa sáng tạo',
  retouchDescription: 'Chọn một vùng, sau đó mô tả bất kỳ thay đổi nào—từ các bản sửa lỗi nhỏ đến thay thế đối tượng lớn.',
  retouchPlaceholder: 'Đầu tiên, hãy chọn một khu vực...',
  retouchPlaceholderGenerative: "ví dụ: 'thay thế chiếc ô tô bằng một chiếc xe đạp'",
  generate: 'Tạo',
  retouchSelectionMode: 'Chế độ chọn',
  retouchModePoint: 'Điểm',
  retouchModeBrush: 'Cọ vẽ',
  retouchBrushTool: 'Công cụ cọ vẽ',
  retouchToolDraw: 'Vẽ',
  retouchToolErase: 'Tẩy',
  retouchBrushSize: 'Kích thước cọ',
  retouchClearMask: 'Xóa vùng chọn',
  retouchRemovalTitle: 'Xóa bằng AI',
  retouchRemoveObject: 'Xóa vật thể',
  retouchRemovePerson: 'Xóa người',
  retouchRemoveReflection: 'Xóa phản chiếu',
  retouchRemoveObjectPrompt: `**NHIỆM VỤ AI: XÓA VẬT THỂ CHÍNH XÁC (KHÓA THEO VÙNG CHỌN)**

**MỤC TIÊU CHÍNH:** Người dùng đã cung cấp một ảnh và một vùng chọn (vùng màu trắng). Nhiệm vụ của bạn và là nhiệm vụ duy nhất là xóa hoàn toàn (các) vật thể nằm **HOÀN TOÀN BÊN TRONG vùng được chọn**.

**QUY TẮC QUAN TRỌNG (KHÔNG THỂ THƯƠNG LƯỢNG):**
1.  **VÙNG CHỌN LÀ TUYỆT ĐỐI:** Vùng chọn xác định khu vực DUY NHẤT bạn được phép thay đổi. Mọi thứ bên ngoài vùng chọn **PHẢI được giữ nguyên 100% và giống hệt ảnh gốc.**
2.  **TÁI TẠO NỀN:** Sau khi xóa vật thể, bạn phải tái tạo lại nền phía sau nó một cách siêu thực. Nền mới phải khớp hoàn hảo về ánh sáng, kết cấu, màu sắc và nhiễu hạt với khu vực xung quanh không được chọn.
3.  **KHÔNG CHỈNH SỬA NGOÀI VÙNG CHỌN:** Bạn bị nghiêm cấm thay đổi, xóa hoặc chỉnh sửa bất kỳ phần nào khác của ảnh, bao gồm các vật thể hoặc người khác nằm ngoài vùng chọn.

**ĐẦU RA:** Chỉ trả về ảnh đã chỉnh sửa.`,
  retouchRemovePersonPrompt: `**NHIỆM VỤ AI: XÓA NGƯỜI CHÍNH XÁC (KHÓA THEO VÙNG CHỌN)**

**MỤC TIÊU CHÍNH:** Người dùng đã cung cấp một ảnh và một vùng chọn (vùng màu trắng). Nhiệm vụ của bạn và là nhiệm vụ duy nhất là xóa hoàn toàn (các) người nằm **HOÀN TOÀN BÊN TRONG vùng được chọn**.

**QUY TẮC QUAN TRỌNG (KHÔNG THỂ THƯƠNG LƯỢNG):**
1.  **VÙNG CHỌN LÀ TUYỆT ĐỐI:** Vùng chọn xác định khu vực DUY NHẤT bạn được phép thay đổi. Mọi thứ bên ngoài vùng chọn **PHẢI được giữ nguyên 100% và giống hệt ảnh gốc.**
2.  **TÁI TẠO NỀN:** Sau khi xóa người, bạn phải tái tạo lại nền phía sau họ một cách siêu thực. Nền mới phải khớp hoàn hảo về ánh sáng, kết cấu, màu sắc và nhiễu hạt với khu vực xung quanh không được chọn.
3.  **KHÔNG CHỈNH SỬA NGOÀI VÙNG CHỌN:** Bạn bị nghiêm cấm thay đổi, xóa hoặc chỉnh sửa bất kỳ phần nào khác của ảnh, bao gồm các vật thể hoặc người khác nằm ngoài vùng chọn.

**ĐẦU RA:** Chỉ trả về ảnh đã chỉnh sửa.`,
  retouchRemoveReflectionPrompt: `**NHIỆM VỤ AI: CHỈNH SỬA ÁNH SÁNG CHÍNH XÁC (LÓA/PHẢN CHIẾU/BÓNG)**

Bạn là một AI phục chế ảnh đẳng cấp thế giới. Nhiệm vụ của bạn là phân tích vùng chọn của người dùng (vùng màu trắng của mặt nạ) và chỉ sửa lỗi ánh sáng được chỉ định (ví dụ: lóa sáng gắt, phản chiếu, hoặc bóng).

**YÊU CẦU CỐT LÕI: BẢO TOÀN CHI TIẾT BÊN DƯỚI (ƯU TIÊN CAO NHẤT)**
- Bạn **PHẢI** bảo toàn kết cấu, vật liệu, màu sắc và chi tiết vật lý ban đầu của bề mặt *bên dưới* lỗi ánh sáng.
- Bạn **BỊ NGHIÊM CẤM** xóa hoặc thay đổi chính vật thể bên dưới. Công việc duy nhất của bạn là bình thường hóa ánh sáng trong vùng đã chọn.
- **QUY TẮC QUAN TRỌNG:** Nếu vùng chọn nằm trên một người, danh tính, đặc điểm khuôn mặt và kết cấu da của họ **KHÔNG ĐƯỢC THAY ĐỔI**.

**GIAO THỨC THỰC HIỆN:**
1. **Phân tích vùng chọn:** Xác định vấn đề ánh sáng trong vùng được che (lóa, phản chiếu, hoặc bóng).
2. **Tái tạo ánh sáng:** Loại bỏ quang sai ánh sáng.
3. **Tái tạo kết cấu:** Tái tạo chi tiết bề mặt bên dưới một cách chân thực, khớp hoàn hảo với các vùng xung quanh không bị ảnh hưởng về ánh sáng, màu sắc và kết cấu.
4. **Hòa trộn liền mạch:** Đảm bảo khu vực đã sửa chữa hòa trộn vô hình với phần còn lại của hình ảnh.

**ĐẦU RA:** Chỉ trả về bức ảnh đã chỉnh sửa.`,
  cropTitle: 'Cắt ảnh',
  cropDescription: 'Nhấp và kéo trên ảnh để chọn vùng cắt.',
  cropAspectRatio: 'Tỷ lệ khung hình',
  cropAspectFree: 'Tự do',
  applyCrop: 'Áp dụng cắt',
  adjustmentTitle: 'Nâng cao bằng AI',
  oneClickTitle: 'Sửa nhanh',
  oneClickAutoEnhance: 'Tự động nâng cao',
  oneClickAutoEnhancePrompt: `**AI TASK: Intelligent Auto-Enhancement v3.1**

Perform a comprehensive, intelligent auto-enhancement on the image. Your goal is a vibrant, deep, and clear result that looks professionally edited, not just automatically adjusted.

**EXECUTION PROTOCOL:**
1.  **Analyze & Correct:** Adjust brightness, contrast, and color balance for a vibrant, natural look.
2.  **Enhance Depth & Texture:** Subtly enhance micro-contrast and local texture to improve detail and give the image more depth and a three-dimensional feel. Do not over-sharpen.
3.  **Final Polish:** Perform a final, subtle pass to denoise and ensure overall clarity.
---
**ADDENDUM: DYNAMIC & CONTEXT-AWARE IDENTITY INTEGRATION PROTOCOL v10.0 (NON-NEGOTIABLE)**
This protocol is a strict, non-negotiable requirement for the final output and overrides all other creative instructions. The goal is to move beyond static preservation to dynamically integrate the subject's "soul" and authenticity into any context.

**PART 1: FORENSIC IDENTITY PRESERVATION (CORE FOUNDATION)**
1.  **IDENTITY & FACIAL STRUCTURE (HIGHEST PRIORITY):** The output **MUST** feature the **EXACT SAME PERSON/PEOPLE**. You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical/balanced (cân đối). You **MUST** perfectly preserve all natural facial asymmetries (e.g., mặt lệch, miệng lệch).
2.  **PHYSICAL ATTRIBUTES:** The final perceived weight must be true to the original. Preserve the original body shape, height, and face shape (mặt to/nhỏ), etc.
3.  **CRITICAL FACIAL FEATURES (FORENSIC-LEVEL DETAIL):** You **MUST** meticulously preserve with zero alteration:
    -   **Eyes:** The exact, original eye shape, size, and angle (monolid/mắt một mí, double-lid/mắt hai mí, hooded/mắt híp).
    -   **Nose:** The original nose shape (e.g., mũi cao, mũi tẹt, mũi to).
    -   **Mouth & Teeth:** Unique dental structures like overbites (răng hô) or snaggle teeth (răng khểnh) **MUST** be retained perfectly.
    -   **Skin & Permanent Features:** Preserve permanent features like dimples (núm đồng tiền), moles, and scars.

**PART 2: DYNAMIC INTEGRATION (CONTEXTUAL AWARENESS & REALISM)**
4.  **DEEP CONTEXTUAL AWARENESS:** You **MUST** understand the context of the entire image to ensure edits are hyper-realistic.
    -   **Physics-Based Lighting:** When changing clothes or adding objects, analyze the scene's light sources. The new elements **MUST** have accurate shadows, highlights, and folds that match the environment. Simulate how light and color from the environment reflect on skin, eyes, and shiny surfaces (e.g., glasses).
    -   **Natural Expressions:** When modifying expressions (e.g., adding a smile), you **MUST** engage the corresponding facial muscles. A smile must include crinkling around the eyes (a "Duchenne smile") to be believable.
5.  **MICRO-EXPRESSION & "SOUL" PRESERVATION:** Beyond static features, you must identify and preserve the subtle "micro-expressions" and mood of the original subject to retain their personality and authenticity.
6.  **GENETIC CONSISTENCY:** When making significant changes (e.g., hair color), the results must remain plausible and natural for the subject's inferred ethnicity and features (skin tone, eye color).
---`,
  oneClickFixLighting: 'Sửa ánh sáng',
  oneClickFixLightingPrompt: `**AI TASK: Professional Portrait Relighting v4.0**

You are a master AI lighting director for portrait photography. Your task is to relight the subject's face to create a professional, flattering, and dramatic studio portrait look, while leaving the background and clothing untouched.

**NON-NEGOTIABLE CORE MANDATES (CRITICAL FAILURE IF VIOLATED):**
1.  **ABSOLUTE DYNAMIC IDENTITY INTEGRATION v10.0:** The output **MUST** feature the **EXACT SAME PERSON**. You are forbidden from altering their fundamental facial structure, perceived weight, asymmetries, or unique features (moles, scars, eye shape, etc.). This is your highest priority.
2.  **BACKGROUND & CLOTHING INTEGRITY:** The background and the subject's clothing **MUST REMAIN 100% UNCHANGED**. Only the lighting on the subject's face, neck, and hair is to be modified.
3.  **PHOTOGRAPHIC REALISM:** The final image must look like a real, professionally-shot photograph, not a digital painting or an overly-processed image.

**EXECUTION PROTOCOL (STRICT ORDER):**
1.  **Isolate Subject:** Identify the primary person in the photograph.
2.  **Analyze Facial Structure:** Understand the contours of the subject's face to apply light and shadow realistically.
3.  **Apply Studio Lighting:** Re-render the lighting on the subject's face, neck, and hair. Create a soft, flattering main light source (key light) coming from a classic portrait angle (e.g., slightly above and to the side).
4.  **Sculpt with Light & Shadow:** Generate soft, realistic shadows to add depth, dimension, and definition to the facial features (e.g., cheekbones, jawline). The result should be more three-dimensional.
5.  **Seamless Integration:** The new lighting on the subject **MUST** blend flawlessly with the unaltered background and clothing. The transition must be invisible.
6.  **Final Polish:** Perform a subtle enhancement to ensure the face is sharp and clear.

**OUTPUT:** Return ONLY the final, relit photograph. Do not output any text.`,
  oneClickBoostColor: 'Tăng cường màu sắc',
  adjustmentTransformTitle: 'Biến đổi',
  adjustmentRotateLeft: 'Xoay trái',
  adjustmentRotateRight: 'Xoay phải',
  adjustmentFlipHorizontal: 'Lật ngang',
  adjustmentFlipVertical: 'Lật dọc',
  adjustmentUpscale8K: 'Nâng cấp lên 8K',
  adjustmentFaceRestore: 'Phục hồi khuôn mặt',
  adjustmentFaceRestorePrompt: `**AI TASK: FORENSIC FACE RESTORATION & FULL IMAGE ENHANCEMENT v10.0**

**PRIMARY DIRECTIVE:** Your highest priority is the absolute, forensic-level preservation of the subject's identity and unique physical characteristics, dynamically integrated with any enhancements. This is non-negotiable.

**NON-NEGOTIABLE CORE MANDATES (DYNAMIC IDENTITY INTEGRATION):**
1.  **IDENTITY & FACIAL STRUCTURE:** The output **MUST** feature the **EXACT SAME PERSON**. You are **STRICTLY FORBIDDEN** from beautifying, idealizing, or making the face more symmetrical/balanced (cân đối). **Asymmetry is KEY:** You **MUST** perfectly preserve all natural facial asymmetries (e.g., mặt lệch, miệng lệch).
2.  **PHYSICAL ATTRIBUTES (BODY & FACE):** The final perceived weight must be true to the original. Do not make them look heavier or thinner. Preserve the original body shape and height. Preserve face shape and size (mặt to, mặt nhỏ), including features like sunken cheeks (má hóp), forehead height (trán cao, trán thấp), chin shape (cằm nhọn), etc.
3.  **MICRO & MACRO FACIAL FEATURES (CRITICAL DETAIL LIST):** You **MUST** meticulously preserve with zero alteration:
    -   **Eyes:** Preserve the exact, original eye shape, size, and angle (e.g., monolid (mắt một mí), double-lid (mắt hai mí), hooded (mắt híp)).
    -   **Nose:** Preserve the original nose shape (e.g., mũi cao, mũi tẹt, mũi to).
    -   **Mouth & Teeth:** Preserve unique dental structures like an overbite (răng hô) or snaggle teeth (răng khểnh).
    -   **Skin Features:** Preserve permanent features like dimples (núm đồng tiền), moles, and scars.
4.  **"SOUL" & MICRO-EXPRESSION PRESERVATION:** Beyond static features, you must identify and preserve the subtle "micro-expressions" and mood of the original subject to retain their personality and authenticity.

**EXECUTION PROTOCOL (STRICT ORDER):**
1.  **Analyze Face:** Identify blurry, out-of-focus, or low-resolution faces.
2.  **Reconstruct Face:** Reconstruct lost facial details with extreme precision while strictly adhering to all identity mandates. Your goal is to add clarity and detail to the *existing* features, **NOT** to create new or "improved" ones. Generate natural, realistic skin texture.
3.  **Integrate:** The restored face(s) must blend perfectly with the rest of the image's lighting and color.
4.  **FINAL FULL-IMAGE ENHANCEMENT:** After restoring the face(s), you **MUST** perform a final enhancement pass on the **ENTIRE** image. Regenerate fine details, denoise, and boost clarity across the whole photograph to ensure the final result is cohesive and of the highest quality.

**OUTPUT:** Return ONLY the final, restored photograph.`,
  adjustmentPreset1: 'Làm mờ hậu cảnh',
  adjustmentPlaceholder: "Hoặc mô tả một điều chỉnh (ví dụ: 'thay đổi nền thành một khu rừng')",
  applyAdjustment: 'Áp dụng',
  adjustmentPortraitTitle: 'Nâng cao chân dung',
  adjustmentPortraitPreset1: 'Làm mịn da',
  adjustmentPortraitPreset2: 'Thêm nụ cười',
  adjustmentPortraitGentleSmile: 'Thêm cười mỉm',
  adjustmentOpenEyes: 'Mở mắt',
  adjustmentStraightenPosture: 'Chỉnh thẳng dáng',
  adjustmentWhitenTeeth: 'Làm trắng răng',
  adjustmentOldPhotoRestorationTitle: 'Phục chế ảnh cũ',
  adjustmentFullRestore4K: 'Phục hồi toàn diện (4K)',
  adjustmentFullRestore4KPrompt: `**NHIỆM VỤ AI: PHỤC CHẾ & NÂNG CAO ẢNH PHÁP Y v10.0**

**CHỈ THỊ CHÍNH:** Ưu tiên cao nhất của bạn là bảo toàn tuyệt đối, ở cấp độ pháp y, danh tính và các đặc điểm thể chất độc đáo của tất cả các đối tượng, đồng thời tích hợp chúng một cách linh hoạt vào một bức ảnh được phục chế hoàn hảo.

**YÊU CẦU CỐT LÕI KHÔNG THỂ THƯƠNG LƯỢNG (TÍCH HỢP DANH TÍNH ĐỘNG):**
1.  **DANH TÍNH & CẤU TRÚC KHUÔN MẶT:** Kết quả **PHẢI** có **CHÍNH XÁC CÙNG MỘT NGƯỜI**. Bạn bị **NGHIÊM CẤM** làm đẹp, lý tưởng hóa, hoặc làm cho khuôn mặt cân đối hơn. **Sự bất đối xứng là CHÌA KHÓA:** Bạn **PHẢI** bảo tồn hoàn hảo tất cả các sự bất đối xứng tự nhiên của khuôn mặt (ví dụ: mặt lệch, miệng lệch).
2.  **THUỘC TÍNH VẬT LÝ (CƠ THỂ & MẶT):** Cân nặng cảm nhận được cuối cùng phải đúng với ảnh gốc. Bảo tồn hình dáng cơ thể và chiều cao ban đầu. Bảo tồn hình dạng và kích thước khuôn mặt (mặt to, mặt nhỏ), bao gồm các đặc điểm như má hóp, chiều cao trán (trán cao, trán thấp), hình dạng cằm (cằm nhọn), v.v.
3.  **CÁC ĐẶC ĐIỂM KHUÔN MẶT VI MÔ & VĨ MÔ (DANH SÁCH CHI TIẾT QUAN TRỌNG):** Bạn **PHẢI** bảo tồn tỉ mỉ với không một thay đổi nào:
    -   **Mắt:** Bảo tồn chính xác hình dạng, kích thước và góc mắt ban đầu (ví dụ: mắt một mí, mắt hai mí, mắt híp).
    -   **Nũi:** Bảo tồn hình dạng mũi ban đầu (ví dụ: mũi cao, mũi tẹt, mũi to).
    -   **Miệng & Răng:** Bảo tồn các cấu trúc răng độc đáo như răng hô hoặc răng khểnh.
    -   **Đặc điểm da:** Bảo tồn các đặc điểm vĩnh viễn như núm đồng tiền, nốt ruồi và sẹo, đồng thời tái tạo kết cấu da tự nhiên.
4.  **BẢO TOÀN "LINH HỒN" & VI BIỂU CẢM:** Ngoài các đặc điểm tĩnh, bạn phải xác định và bảo tồn "vi biểu cảm" và tâm trạng tinh tế của đối tượng ban đầu để giữ lại tính cách và sự chân thực của họ.

**GIAO THỨC THỰC HIỆN (THỨ TỰ NGHIÊM NGẶT):**

1.  **PHỤC HỒI & NÂNG CAO CỐT LÕI:** Đây là bước quan trọng nhất.
    -   **Sửa chữa hư hỏng:** Sửa chữa tất cả các hư hỏng vật lý (vết xước, rách, đốm).
    -   **Phục hồi độ rõ nét:** Sửa chữa mạnh mẽ tất cả các vùng bị mất nét, loại bỏ tất cả lóa và phản chiếu, và khử sương mù và giảm nhiễu triệt để.
    -   **Tái tạo chi tiết:** Tái tạo chi tiết bị mất trên khuôn mặt, quần áo và nền một cách pháp y.
    -   **Tô màu & Ánh sáng Nhận thức Ngữ cảnh:** Áp dụng màu sắc tự nhiên, hợp lý về mặt lịch sử. Phân tích bối cảnh để tạo ra ánh sáng mềm mại và chuyên nghiệp, hoàn chỉnh với bóng đổ và điểm sáng chân thực.
2.  **NÂNG CẤP & LÀM SẮC NÉT CUỐI CÙNG (BƯỚC CUỐI CÙNG QUAN TRỌNG):**
    -   Nâng cấp toàn bộ hình ảnh lên độ phân giải ít nhất 4K.
    -   Áp dụng một lượt làm sắc nét mạnh mẽ cuối cùng để tối đa hóa độ rõ nét và chi tiết. Mục tiêu là làm cho kết quả cuối cùng sắc nét, chi tiết và sạch sẽ đến mức đặc biệt, trông giống như một bức ảnh hiện đại, **mới chụp**. **Tối đa hóa chi tiết đầu ra là mục tiêu chính của bước này.**

**ĐẦU RA:** Chỉ trả về bức ảnh đã phục chế cuối cùng.`,
  beautyTitle: 'Làm đẹp',
  beautyDescription: 'Áp dụng các cải tiến làm đẹp tinh tế, thực tế cho ảnh chân dung.',
  beautyApplyMakeup: 'Trang điểm',
  beautySlimFace: 'Làm thon mặt',
  beautyRemoveBlemishes: 'Xóa khuyết điểm',
  beautyRemoveFreckles: 'Xóa tàn nhang',
  idPhotoTitle: 'Tạo ảnh thẻ',
  idPhotoDescription: 'Tạo ảnh thẻ chuyên nghiệp bằng cách chọn từ các tùy chọn bên dưới.',
  idPhotoType: 'Loại',
  idPhotoTypeStandard: 'Tiêu chuẩn',
  idPhotoTypeNewborn: 'Trẻ sơ sinh',
  idPhotoNewbornInfo: 'Đối với trẻ sơ sinh, các cài đặt về biểu cảm, trang phục và kiểu tóc được tự động tối ưu hóa để tuân thủ quy định.',
  idPhotoGender: 'Giới tính',
  idPhotoGenderMale: 'Nam',
  idPhotoGenderFemale: 'Nữ',
  idPhotoOutfit: 'Trang phục',
  idPhotoOutfitSuit: 'Vest & Cà vạt',
  idPhotoOutfitBlouse: 'Áo sơ mi nữ',
  idPhotoOutfitAoDai: 'Áo dài',
  idPhotoOutfitCollaredShirtM: 'Áo sơ mi có cổ',
  idPhotoOutfitCollaredShirtF: 'Áo sơ mi có cổ',
  idPhotoOutfitOfficeWear: 'Đồ công sở',
  idPhotoHairstyle: 'Kiểu tóc',
  idPhotoHairProfessional: 'Chuyên nghiệp',
  idPhotoHairKeep: 'Giữ nguyên',
  idPhotoHairShortNeat: 'Tóc ngắn gọn gàng',
  idPhotoHairTiedBack: 'Buộc gọn gàng',
  idPhotoHairNeatDown: 'Xõa gọn gàng',
  idPhotoHairMaleNeat: 'Chải chuốt gọn gàng',
  idPhotoHairMaleShort: 'Tóc ngắn công sở',
  idPhotoHairMaleMedium: 'Tóc dài vừa',
  idPhotoExpression: 'Biểu cảm',
  idPhotoExpressionKeep: 'Giữ nguyên',
  idPhotoExpressionNeutral: 'Trung tính',
  idPhotoExpressionSmile: 'Mỉm cười',
  idPhotoExpressionBigSmile: 'Cười tươi',
  idPhotoBackgroundColor: 'Nền',
  idPhotoBgWhite: 'Trắng',
  idPhotoBgBlue: 'Xanh dương',
  idPhotoBgGray: 'Xám',
  idPhotoBgGreen: 'Xanh lá',
  idPhotoSize: 'Kích thước',
  idPhotoApply: 'Tạo ảnh thẻ',
  idPhotoCustomPromptLabel: 'Hướng dẫn tùy chỉnh',
  idPhotoCustomPromptPlaceholder: "ví dụ: 'thêm cà vạt màu xanh nhạt'",
  filterTitle: 'Áp dụng bộ lọc',
  filterPlaceholder: "Hoặc mô tả một bộ lọc tùy chỉnh (ví dụ: 'ánh sáng synthwave thập niên 80')",
  applyFilter: 'Áp dụng',
  filterSectionCamera: 'Giả lập máy ảnh',
  filterCameraFuji: 'Phong cách Fujifilm',
  filterCameraKodak: 'Phong cách Kodak',
  filterCameraLeica: 'Phong cách Leica',
  filterCameraCanon: 'Phong cách Canon',
  filterSectionFilm: 'Phim & Cổ điển',
  filterFilmVintage: 'Phim cổ điển',
  filterFilmBW: 'Đen trắng',
  filterFilmSepia: 'Tông nâu đỏ',
  filterFilmPolaroid: 'Polaroid',
  filterSectionArtistic: 'Phong cách nghệ thuật',
  filterArtisticOil: 'Tranh sơn dầu',
  filterArtisticWatercolor: 'Tranh màu nước',
  filterArtisticSketch: 'Phác thảo bút chì',
  filterArtisticPopArt: 'Pop Art',
  filterSectionColor: 'Chỉnh màu',
  filterColorCinematic: 'Màu điện ảnh',
  filterColorMoody: 'Màu tâm trạng',
  filterColorGolden: 'Giờ vàng',
  filterColorVibrant: 'Màu HDR rực rỡ',
  filterColorCleanBright: 'Sạch sẽ & Tươi sáng',
  filterColorSoftPortrait: 'Chân dung nhẹ nhàng',
  filterColorDramaticPortrait: 'Chân dung kịch tính',
  filterColorLushGreens: 'Cây cỏ tươi tốt',
  filterColorAzureBlues: 'Biển trời xanh biếc',
  filterColorAutumnGlow: 'Sắc thu ấm áp',
  filterSectionDigital: 'Hiện đại & Kỹ thuật số',
  filterDigitalSynthwave: 'Synthwave',
  filterDigitalGlitch: 'Glitch',
  filterDigitalDuotone: 'Duotone',
  filterDigitalPixel: 'Pixel Art',
  undo: 'Hoàn tác',
  redo: 'Làm lại',
  reset: 'Đặt lại',
  uploadNew: 'Tải ảnh mới',
  startOver: 'Làm lại từ đầu',
  showTools: 'Hiện công cụ',
  hideTools: 'Ẩn công cụ',
  downloadImage: 'Tải xuống',
  original: 'Gốc',
  edited: 'Đã sửa',
  zoomOut: 'Thu nhỏ',
  resetZoom: 'Đặt lại thu phóng',
  zoomIn: 'Phóng to',
  compareSliderAria: 'Kéo để so sánh phiên bản trước và sau',
  historyTitle: 'Lịch sử',
  historyStep: 'Bước {step}',
  historyOriginal: 'Gốc',
  viewEdited: 'Xem ảnh đã sửa',
  viewOriginal: 'Xem ảnh gốc',
  insertErrorNoSubjects: 'Vui lòng thêm ít nhất một ảnh chủ thể để ghép.',
  scanModalTitle: 'Tài liệu đã quét',
  scanModalClose: 'Đóng',
  scanDiscard: 'Hủy bỏ',
  scanAdjustCorners: 'Điều chỉnh góc',
  scanDownloadPdf: 'Tải PDF',
  scanExportToWord: 'Xuất ra .docx',
  scanExportToExcel: 'Xuất ra .xlsx',
  scanSave: 'Lưu vào trình sửa',
  scanModalZoomOut: 'Thu nhỏ',
  scanModalResetZoom: 'Đặt lại thu phóng',
  scanModalZoomIn: 'Phóng to',
  scanTitle: 'Quét tài liệu',
  scanDescription: 'Tự động sửa góc nhìn và nâng cao chất lượng ảnh tài liệu.',
  scanEnhancement: 'Nâng cao',
  scanColor: 'Màu',
  scanGrayscale: 'Thang xám',
  scanBW: 'Đen & Trắng',
  scanRemoveShadows: 'Xóa bóng',
  scanRemoveHandwriting: 'Xóa chữ viết tay',
  scanRestoreText: 'Phục hồi văn bản',
  scanRestoreTextTooltip: 'Sử dụng AI để tái tạo và làm sắc nét văn bản bị mờ hoặc xuống cấp. Có thể làm thay đổi phông chữ gốc.',
  scanAuto: 'Quét tự động',
  scanManual: 'Quét thủ công',
  scanManualTitle: 'Điều chỉnh góc',
  scanManualDescription: 'Kéo các góc để xác định vùng tài liệu, sau đó áp dụng quét.',
  scanApplyManual: 'Áp dụng quét',
  scanCancel: 'Hủy',
  scanHistoryTitle: 'Các lần quét gần đây',
  scanHistoryReview: 'Xem lại bản quét',
  expandTitle: 'Mở rộng sáng tạo',
  expandDescription: 'Kéo các tay cầm để mở rộng khung ảnh, sau đó mô tả nội dung để lấp đầy vùng mới.',
  expandPlaceholder: "ví dụ: 'thêm nhiều bầu trời xanh'",
  expandApply: 'Mở rộng ảnh',
  expandMagic: 'Mở rộng thần kỳ',
  expandAspectFree: 'Tự do',
  insertTitle: 'Ghép ảnh & Chèn',
  insertDescription: 'Kết hợp nhiều hình ảnh. Thêm chủ thể, nền và tham chiếu phong cách để tạo ra một hình ảnh mới.',
  insertSubject: 'Chủ thể (Các mục chính cần bao gồm)',
  insertBackgroundOptional: 'Nền (Tùy chọn)',
  insertStyle: 'Tham chiếu phong cách (Tùy chọn)',
  insertUploadPlaceholder: 'Tải lên',
  insertClickToChange: 'Nhấp để thay đổi',
  insertPromptPlaceholder: 'ví dụ: các chủ thể cưỡi ngựa trên bãi biển nền',
  insertPromptPlaceholderInitial: 'ví dụ: một con mèo đeo kính râm',
  insertApply: 'Tạo ảnh',
  insertUseSearch: 'Cải thiện lời nhắc với Google Search (cho các chủ đề gần đây)',
  extractTitle: 'Trích xuất vật thể',
  extractDescription: 'Mô tả một đối tượng trong ảnh để trích xuất nó với nền trong suốt.',
  extractPlaceholder: "ví dụ: 'chiếc xe màu đỏ'",
  extractApply: 'Trích xuất',
  extractResultTitle: 'Các vật thể đã trích xuất',
  extractHistoryTitle: 'Lịch sử trích xuất',
  extractUseAsStyle: 'Dùng làm phong cách',
  swapFaceTitle: 'Hoán đổi khuôn mặt',
  swapFaceDescription: 'Thay thế một khuôn mặt trong ảnh chính bằng một khuôn mặt từ ảnh khác.',
  swapFaceApply: 'Hoán đổi khuôn mặt',
  swapFaceUploadPrompt: 'Tải ảnh có khuôn mặt mới',
  faceSwapHowToTitle: 'Cách hoán đổi khuôn mặt',
  faceSwapHowTo1_p1: 'Trong hộp',
  faceSwapHowTo1_p2: ', nhấp vào số trên khuôn mặt bạn muốn thay thế.',
  faceSwapHowTo2_p1: 'Tải ảnh lên hộp',
  faceSwapHowTo2_p2: ' và chọn khuôn mặt mới.',
  faceSwapHowTo3: 'Phải chọn cả khuôn mặt mục tiêu và khuôn mặt nguồn.',
  faceSwapHowTo4_p1: 'Nhấp vào',
  faceSwapHowTo4_p2: 'để tạo kết quả.',
  faceSwapTargetTitle: 'Ảnh gốc',
  faceSwapSourceTitle: 'Khuôn mặt mới',
  faceSwapNoTargetImage: 'Tải một ảnh vào trình chỉnh sửa trước.',
  faceSwapUploadFaceButton: 'Tải lên một khuôn mặt',
  orSeparator: 'HOẶC',
  studioTitle: 'Chế độ Studio',
  studioDescription: 'Tạo một buổi chụp ảnh chuyên nghiệp. Mô tả một phong cách và nhận 3 kết quả khác nhau.',
  studioPromptPlaceholder: "ví dụ: 'bìa tạp chí thời trang cổ điển thập niên 90'",
  generatePhotoshoot: 'Tạo buổi chụp ảnh',
  studioModalTitle: 'Kết quả buổi chụp ảnh của bạn',
  studioModalLoading: 'Đang tạo buổi chụp ảnh của bạn... Việc này có thể mất một chút thời gian. Vui lòng đợi khi các ảnh mới xuất hiện bên dưới.',
  studioSelectResult: 'Chọn',
  studioDownloadResult: 'Tải xuống',
  studioResultsTitle: 'Kết quả Studio',
  compositeResultsTitle: 'Kết quả đã tạo',
  adjustmentResultsTitle: 'Kết quả điều chỉnh',
  idPhotoResultsTitle: 'Kết quả ảnh thẻ',
  studioClearResults: 'Xóa',
  studioPoseStyle: 'Kiểu tạo dáng',
  studioPoseStyleAutomatic: 'Tự động',
  studioPoseStyleDynamic: 'Năng động',
  studioPoseStyleCandid: 'Tự nhiên',
  studioPoseStyleFormal: 'Trang trọng',
  studioCameraAngle: 'Góc máy ảnh',
  studioAngleFront: 'Chính diện',
  studioAngle34Left: 'Nghiêng 3/4 (T)',
  studioAngle34Right: 'Nghiêng 3/4 (P)',
  studioAngleProfileLeft: 'Nhìn nghiêng (T)',
  studioAngleProfileRight: 'Nhìn nghiêng (P)',
  studioAngleAbove: 'Góc cao',
  studioAngleBelow: 'Góc thấp',
  suggestionTitle: 'Gợi ý:',
  suggestionRestoreFace: 'Phục hồi khuôn mặt?',
  suggestionFixLighting: 'Sửa ánh sáng?',
  suggestionPortraitTools: 'Công cụ Chân dung',
  suggestionDismiss: 'Bỏ qua',
};

export const translations = {
  vi,
};

export type TranslationKey = keyof typeof vi;