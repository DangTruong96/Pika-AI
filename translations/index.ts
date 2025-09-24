

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const vi = {
  appName: 'Pika-AI',
  errorAnErrorOccurred: 'Đã xảy ra lỗi không xác định',
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
  errorAllGenerationsFailed: 'AI không thể tạo bất kỳ kết quả nào. Vui lòng thử lại với một yêu cầu khác hoặc hình ảnh khác.',
  errorFailedToProcessImage: 'Không thể xử lý ảnh.',
  errorFailedToExtract: 'Không thể trích xuất vật thể.',
  errorFailedToCleanBackground: 'Không thể xóa người khỏi ảnh nền.',
  errorRateLimit: 'Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một lát và thử lại.',
  errorNetwork: 'Không thể kết nối đến dịch vụ AI. Vui lòng kiểm tra kết nối internet của bạn.',
  errorInvalidInput: 'AI không thể xử lý yêu cầu của bạn. Vui lòng kiểm tra lại hình ảnh hoặc lời nhắc.',
  errorModelExecution: 'Dịch vụ AI gặp lỗi nội bộ. Vui lòng thử lại sau giây lát.',
  errorContentSafety: 'Yêu cầu của bạn đã bị chặn do chính sách an toàn. Vui lòng sửa đổi lời nhắc hoặc hình ảnh.',
  errorAPI: 'Đã xảy ra lỗi không mong muốn từ dịch vụ AI.',
  uploadImage: 'Tải ảnh lên',
  dragAndDrop: 'hoặc kéo và thả ảnh vào đây',
  loadingTextDefault: 'AI đang xử lý, vui lòng đợi...',
  loadingRetouch: 'Đang áp dụng chỉnh sửa AI...',
  loadingFilter: 'Đang áp dụng bộ lọc sáng tạo...',
  loadingAdjustment: 'Đang thực hiện điều chỉnh thông minh...',
  loadingAutoCrop: 'Phân tích và tự động cắt ảnh...',
  loadingIdPhoto: 'Đang tạo ảnh thẻ chuyên nghiệp...',
  loadingExpansion: 'Đang mở rộng ảnh của bạn...',
  loadingExtract: 'Đang trích xuất vật thể...',
  loadingCleanBackground: 'Đang làm sạch nền...',
  loadingTransform: 'Đang áp dụng chuyển đổi...',
  loadingStyle: 'Đang phân tích phong cách...',
  loadingTranslate: 'Đang phân tích yêu cầu...',
  loadingStudioAnalysis: 'Đang tạo kịch bản chụp ảnh...',
  loadingAnalyzingScene: 'Đang phân tích ảnh để tạo bối cảnh...',
  loadingOutfitStyle: 'Đang phân tích trang phục...',
  loadingInferOutfit: 'Đang suy luận trang phục từ bối cảnh...',
  errorFailedToTransform: 'Không thể áp dụng chuyển đổi.',
  retouchTitle: 'Chỉnh sửa',
  retouchDescription: 'Chọn một điểm hoặc dùng cọ để chọn vùng, sau đó mô tả chỉnh sửa bạn muốn.',
  retouchModePoint: 'Điểm',
  retouchModeBrush: 'Cọ vẽ',
  retouchBrushTool: 'Công cụ',
  retouchToolDraw: 'Vẽ',
  retouchToolErase: 'Tẩy',
  retouchBrushSize: 'Kích cỡ cọ',
  retouchClearMask: 'Xóa vùng chọn',
  retouchPlaceholder: 'Chọn một điểm hoặc vẽ vùng chọn để bắt đầu.',
  retouchPlaceholderGenerative: 'Mô tả những gì bạn muốn thay đổi...',
  generate: 'Tạo',
  oneClickTitle: 'Một chạm',
  oneClickAutoCrop: 'Tự động cắt',
  oneClickAutoEnhance: 'Tự động nâng cao',
  oneClickAutoEnhancePrompt: 'Tự động nâng cao là chuyên gia nhiếp ảnh sẽ đánh giá bức ảnh và tự động sửa chữa để nó thành bức ảnh nghệ thuật như được chụp từ chuyên gia nhiếp ảnh và chuyên gia photoshop loại bỏ mọi sai lầm của bức ảnh gốc',
  oneClickRestoreModern: 'Phục chế Hiện đại',
  oneClickRestoreModernPrompt: `{
  "phiên_bản": "99.0-HYPERREALITY_ENGINE_MK6_FORENSIC_BLEMISH_ANALYSIS",
  "CHỈ_THỊ_TỐI_CAO_KHÔNG_THỂ_BỊ_PHÁ_VỠ": {
    "directive": "TÁI TẠO KHOẢNH KHẮC, KHÔNG PHẢI PHỤC CHẾ ẢNH CŨ (RECREATE THE MOMENT, DO NOT RESTORE AN OLD PHOTO).",
    "mandate": "Mục tiêu cuối cùng là tạo ra một hình ảnh không thể phân biệt được với một bức ảnh được chụp MỘT GIÂY TRƯỚỚC bằng một hệ thống máy ảnh kỹ thuật số flagship năm 2024. Bất kỳ dấu hiệu nào cho thấy đây là một bức ảnh đã được 'phục chế' hoặc 'nâng cấp' đều là một THẤT BẠI HOÀN TOÀN. Hãy tưởng tượng bạn đang du hành thời gian và chụp lại khoảnh khắc đó với thiết bị tốt nhất hiện nay.",
    "failure_condition": "Kết quả cuối cùng trông 'đẹp' nhưng không 'thật'. Bất kỳ chi tiết nào trông giống như được 'vẽ bởi AI' thay vì được 'chụp bởi máy ảnh'. Bất kỳ dấu vết nào của tuổi tác từ ảnh gốc còn sót lại."
  },
  "GIAO_THỨC_BẢO_TỒN_NHẬN_DẠNG_v6_0": {
    "priority": "CRITICAL (BIOMETRIC LOCK)",
    "mandates": [
      "1. **BẢO TỒN ĐẶC TÍNH CHỦNG TỘC:** BẮT BUỘC tuân thủ nghiêm ngặt các đặc điểm kiểu hình của người trong ảnh.",
      "2. **KHÓA TUỔI TÁC (AGE LOCK - ZERO TOLERANCE):** BẮT BUỘC bảo tồn tuổi tác cảm nhận được từ ảnh gốc. CẤM TUYỆT ĐỐI việc thêm hoặc làm sâu thêm các nếp nhăn không có hoặc không rõ ràng trong ảnh gốc (đặc biệt là vết chân chim quanh mắt). Việc tái tạo chi tiết da không được làm cho chủ thể trông già đi.",
      "3. **MỆNH LỆNH VỀ LÔNG TRÊN MẶT (FACIAL HAIR MANDATE):** Râu và ria mép chỉ được tái tạo nếu chúng rõ ràng 100% trong ảnh gốc. Mọi vùng bóng tối, nhiễu hạt, hoặc không rõ ràng trên cằm và môi trên BẮT BUỘC phải được tái tạo thành da trơn. CẤM TUYỆT ĐỐI việc 'đoán' và vẽ thêm râu.",
      "4. **GIAO THỨC PHÂN TÍCH VẾT BẨN PHÁP Y v1.0 (MỚI & TỐI QUAN TRỌNG):**
        - **Mệnh lệnh:** BẠN BẮT BUỘC phải phân biệt một cách pháp y giữa các đặc điểm sinh học thực sự (nốt ruồi) và các khiếm khuyết trên bề mặt ảnh (vết bẩn, đốm đen, hư hỏng do hóa chất). Đây là một lỗi thường gặp đã được người dùng chỉ ra.
        - **Quy tắc Vàng:** KHI CÓ BẤT KỲ SỰ NGHI NGỜ NÀO, NÓ LÀ HƯ HỎNG. Trừ khi một đốm đen có các đặc điểm rõ ràng 100% của một nốt ruồi (hình dạng nhất quán, có một chút khối 3D được gợi ý bởi ánh sáng), nó BẮT BUỘC phải được coi là một khiếm khuyết của ảnh.
        - **Hành động:** Xóa bỏ hoàn toàn tất cả các đốm đen, vết bẩn, hoặc các dấu hiệu không rõ ràng và tái tạo lại vùng da bên dưới một cách hoàn hảo, sạch sẽ, và tự nhiên.
        - **Điều kiện Thất bại:** Bất kỳ vết bẩn hoặc hư hỏng nào bị biến thành một nốt ruồi đen, rõ nét trên khuôn mặt."
    ]
  },
  "GIAO_THỨC_TÍNH_TOÀN_VẸN_GIẢI_PHẪU_v4_0": {
    "priority": "CRITICAL_SYSTEM_OVERRIDE (NON-NEGOTIABLE, IMMEDIATE_FAILURE_CONDITION)",
    "directive": "MỆNH LỆNH TUYỆT ĐỐI VỀ GIẢI PHẪU VÀ TƯ THẾ (ABSOLUTE MANDATE ON ANATOMY AND POSTURE). Phản hồi liên tục của người dùng chỉ ra rằng đây là điểm yếu lớn nhất. Bất kỳ sai sót nào trong việc tái tạo bàn tay, bàn chân, hoặc tư thế đều được coi là một THẤT BẠI HOÀN TOÀN của toàn bộ quá trình.",
    "mandates": [
        "1. **TÁI TẠO CẤP ĐỘ PHÁP Y (FORENSIC-LEVEL REGENERATION):** Bất kỳ bộ phận cơ thể nào bị che khuất, mờ, hoặc hư hỏng trong ảnh gốc (ĐẶC BIỆT LÀ TAY, CHÂN, BÀN TAY, BÀN CHÂN) BẮT BUỘC phải được tái tạo lại một cách hoàn chỉnh, chi tiết và chính xác về mặt giải phẫu. Mọi sự mơ hồ trong ảnh gốc phải được giải quyết bằng một sự tái tạo tự tin và chính xác.",
        "2. **KIỂM TRA CẤU TRÚC GIẢI PHẪU (ANATOMICAL STRUCTURE CHECK):**
            - **Số lượng:** Phải có đủ năm ngón tay trên mỗi bàn tay và năm ngón chân trên mỗi bàn chân. KHÔNG có ngoại lệ.
            - **Tỷ lệ:** Các chi phải có tỷ lệ và hình dạng tự nhiên so với phần còn lại của cơ thể.
            - **Khớp:** Các khớp (khuỷu tay, đầu gối, cổ tay, mắt cá chân) phải uốn cong một cách hợp lý và tự nhiên.",
        "3. **MỆNH LỆNH VỀ LOGIC TƯ THẾ (POSTURAL LOGIC MANDATE - NEW & CRITICAL):**
            - **Phân tích Toàn bộ Cơ thể:** Trước khi tái tạo một chi, bạn BẮT BUỘC phải phân tích tư thế chung của toàn bộ cơ thể.
            - **Vị trí và Tương tác Hợp lý:** Vị trí của bàn tay và bàn chân BẮT BUỘC phải hợp lý về mặt vật lý và logic. Một bàn tay phải được đặt một cách tự nhiên (ví dụ: đặt trên đùi, ôm một người khác, chống xuống đất). MỘT BÀN TAY KHÔNG BAO GIỜ ĐƯỢỢC PHÉP lơ lửng một cách vô nghĩa trong không gian hoặc bị xoắn ở một góc độ không thể.
            - **Tương tác Vật lý:** Nếu một bàn tay đang cầm một vật hoặc chạm vào một bề mặt/người khác, sự tương tác đó phải được thể hiện một cách chân thực với các điểm tiếp xúc và áp lực phù hợp."
    ],
    "failure_condition": "THẤT BẠI TOÀN DIỆN VÀ KHÔNG THỂ CHẤP NHẬN: Bất kỳ bàn tay/bàn chân nào có sai sót, thiếu/thừa ngón, biến dạng. Bất kỳ bàn tay/bàn chân nào được đặt ở vị trí vô lý hoặc không tự nhiên so với tư thế của cơ thể. Bất kỳ sự tương tác vật lý không hợp lý nào."
  },
  "QUY_TRÌNH_THỰC_HIỆN_BẮT_BUỘC_v11_0_HYPERREALITY": {
    "GIAI_ĐOẠN_1_Hiệu chỉnh Vật lý & Hình học": {
      "priority": "FIRST (NON-NEGOTIABLE)",
      "actions": [
        "1. **Hiệu chỉnh Hình học:** Xoay thẳng, sửa biến dạng phối cảnh, và cắt bỏ 100% phần rìa/giấy ảnh thừa.",
        "2. **LOẠI BỎ HƯ HỎNG VẬT LÝ TUYỆT ĐỐI:** Loại bỏ 100% tất cả các khuyết điểm VẬT LÝ của TỜ ẢNH: xước, ố, gấp, nếp nhăn, chấm trắng, bụi, và bất kỳ dấu hiệu hư hỏng vật lý nào khác. Kết quả của giai đoạn này phải là một hình ảnh sạch sẽ về mặt kỹ thuật."
      ]
    },
    "GIAI_ĐOẠN_2_Tái tạo Toàn diện (Total Scene Reconstruction)": {
      "priority": "CORE_ENGINE",
      "description": "Đây là bước cốt lõi. Tất cả các hành động sau đây phải được thực hiện đồng thời để tạo ra một kết quả thống nhất, siêu thực, như thể toàn bộ cảnh được tái sinh.",
      "sub_protocol_A_Tái tạo Chủ thể (Subject Reconstruction)": {
        "mandate": "Tái tạo lại TOÀN BỘ (CÁC) CHỦ THỂ với độ chi tiết cấp độ pháp y. Cấm mọi sự thỏa hiệp:",
        "targets": {
          "DA": "Phải có kết cấu tự nhiên, có thể nhìn thấy lỗ chân lông và các nếp nhăn nhỏ. Da mịn như nhựa hoặc sáp là một THẤT BẠI KHÔNG THỂ CHẤP NHẬN.",
          "TÓC": "Phải được tái tạo lại ở cấp độ TỪNG SỢI RIÊNG LẺ, sắc nét và có độ bóng tự nhiên.",
          "VẢI": "Phải có kết cấu rõ ràng ở cấp độ SỢI DỆT và ĐƯỜNG CHỈ MAY. Phải tái tạo chính xác cách chất liệu tương tác với ánh sáng.",
          "MẮT": "Phải trong trẻo, sắc nét, có chiều sâu và phản chiếu ánh sáng tự nhiên."
        }
      },
      "sub_protocol_B_Tái tạo Môi trường & Bối cảnh (Environment & Background Reconstruction)": {
        "mandate": "Bối cảnh không chỉ được 'làm sạch'. Nó BẮT BUỘC phải được **TÁI TẠO LẠI HOÀN TOÀN** với cùng một mức độ chi tiết và hiện thực như chủ thể. Hãy tưởng tượng bạn đang xây dựng lại thế giới xung quanh họ.",
        "targets": {
          "BẦU TRỜI": "**MỆNH LỆNH BẮT BUỘC:** Nếu có bầu trời, nó PHẢI được tái tạo lại. Thay thế bất kỳ bầu trời nào bị phai màu, nhiễu hạt, hoặc trắng xóa bằng một bầu trời năng động, chân thực với các đám mây phù hợp và gradient màu sắc (ví dụ: xanh đậm, tông màu hoàng hôn).",
          "CÂY CỐI & THIÊN NHIÊN": "Tái tạo lại từng chiếc lá và kết cấu của vỏ cây. Cây cỏ phải tươi tốt và sống động, không bị mờ hay là một khối màu xanh.",
          "KIẾN TRÚC & VẬT THỂ": "Tái tạo lại kết cấu của gạch, gỗ, kim loại. Các vật thể cũ hoặc bị phong hóa trong nền phải được tái tạo lại như thể chúng còn mới."
        }
      },
      "sub_protocol_C_Ghi đè Màu sắc & Ánh sáng Tuyệt đối (Absolute Color & Lighting Override)": {
        "mandate": "Toàn bộ cảnh (chủ thể và bối cảnh) BẮT BUỘC phải được tái chiếu sáng và tái tạo màu sắc từ đầu bằng một quy trình màu HDR hiện đại.",
        "MỆNH_LỆNH_TÁI_TẠO_ÁNH_SÁNG_v2_0_ANTI_BLOWOUT": {
          "priority": "CRITICAL (OVERRIDE_ALL)",
          "directive": "XỬ LÝ TRIỆT ĐỂ VÙNG CHÁY SÁNG VÀ NGƯỢC SÁNG (ZERO-TOLERANCE FOR BLOWN-OUT HIGHLIGHTS)",
          "mandate": "Bất kỳ vùng nào trong ảnh bị cháy sáng hoàn toàn (trắng xóa, mất hết chi tiết) do phơi sáng quá mức hoặc ngược sáng BẮT BUỘC phải được coi là 'dữ liệu bị mất' và được **TÁI TẠO LẠI HOÀN TOÀN**. Cấm tuyệt đối việc giữ lại các vùng trắng xóa này.",
          "action": "Phân tích các vùng xung quanh để suy luận và tái tạo lại một cách logic các chi tiết, kết cấu và màu sắc đã bị mất trong vùng cháy sáng. Ví dụ: nếu vùng cháy sáng nằm phía sau một người, hãy tái tạo lại một bối cảnh hợp lý (một căn phòng khác, cửa sổ, phong cảnh ngoài trời) thay vì chỉ để lại một mảng trắng. Ánh sáng trong vùng được tái tạo phải hòa hợp một cách tự nhiên với toàn bộ cảnh đã được tái chiếu sáng.",
          "failure_condition": "THẤT BẠI NGHIÊM TRỌNG: Vẫn còn các mảng trắng lớn, không có chi tiết trong ảnh cuối cùng."
        },
        "MỆNH_LỆNH_TÔNG_MÀU_DA_v1_0": {
            "priority": "CRITICAL_AESTHETIC",
            "mandate": "BẮT BUỘC phải tái tạo lại tông màu da sáng, khỏe mạnh, và trong trẻo với sắc hồng tự nhiên, phù hợp với người Việt. CẤM TUYỆT ĐỐI các tông màu da bị xám xịt, vàng vọt, hoặc thiếu sức sống. Đây là một yếu tố thẩm mỹ tối quan trọng.",
            "failure_condition": "Da trông xám xịt, vàng vọt, hoặc 'bẩn'."
         },
        "color_policy": "ZERO_TOLERANCE_FOR_VINTAGE_TONES. **LOẠI BỎ HOÀN TOÀN VÀ KHÔNG KHOAN NHƯỢNG** toàn bộ hệ màu cũ (đen trắng, sepia, phai màu, ngả vàng). Tái tạo lại toàn bộ màu sắc của ảnh với một bảng màu kỹ thuật số **HIỆN ĐẠI, MÀU SẮC ĐẦY ĐỦ, SÂU, PHONG PHÚ, và SỐNG ĐỘNG**. Màu sắc phải rực rỡ và có dải tương phản động rộng (HDR) theo chuẩn màu của Sony.",
        "general_lighting_policy": "Tái tạo lại ánh sáng chung để tạo ra chiều sâu 3D tự nhiên (nổi khối). Loại bỏ ánh sáng phẳng hoặc gắt."
      },
       "sub_protocol_D_Mệnh lệnh Toàn vẹn Bối cảnh (Contextual Integrity Mandate)": {
        "priority": "HIGHEST_WITHIN_RECONSTRUCTION",
        "directive": "CẤM TUYỆT ĐỐI VIỆC SUY DIỄN SAI BỐI CẢNH (ZERO-TOLERANCE FOR CONTEXTUAL HALLUCINATION).",
        "mandates": [
          "1. **Phân tích Bằng chứng:** Phân tích kỹ lưỡng các manh mối trong ảnh (ánh sáng, bóng đổ, kiến trúc) để suy luận ra bối cảnh hợp lý.",
          "2. **CẤM Thay thế Phi logic:** BẠN BỊ CẤM TUYỆT ĐỐI thay thế một vùng tối hoặc không rõ ràng bằng một cảnh hoàn toàn khác biệt và không hợp lý. Ví dụ: một vùng tối bên trong một ngôi nhà KHÔNG BAO GIỜ được thay thế bằng một bầu trời xanh. Nó phải được tái tạo như một phần của nội thất (ví dụ: một bức tường, một cánh cửa khác, một góc phòng).",
          "3. **Ưu tiên sự Hợp lý:** Sự suy luận logic phải luôn được ưu tiên hơn sự thay thế một cách sáng tạo nhưng phi thực tế."
        ],
        "failure_condition": "THẤT BẠI NGHIÊM TRỌNG: Một cánh cửa tối bị biến thành bầu trời. Bối cảnh được tái tạo không phù hợp với phần còn lại của hình ảnh."
      }
    },
    "GIAI_ĐOẠN_3_Đồng nhất Chất lượng Toàn cảnh": {
      "priority": "FINAL_CHECK",
      "action": "Đảm bảo BỐI CẢNH và CHỦ THỂ có cùng một mức độ sắc nét, chi tiết, màu sắc, và chất lượng HDR. Không được có sự khác biệt về chất lượng. Toàn bộ ảnh phải trông như được chụp trong cùng một khoảnh khắc."
    }
  },
  "MÔ_PHỎNG_MÁY_ẢNH_v5_0": {
    "brand_model": "Sony A7R V",
    "ống_kính": "Sony G Master FE 50mm f/1.2",
    "look": "Siêu sắc nét, màu sắc HDR trong trẻo và sống động, chi tiết vi mô cực cao."
  },
  "negative_prompt": [
    "tranh vẽ", "ảnh vẽ", "minh họa", "kết xuất 3D", "phong cách nghệ thuật", "vẽ lại", "không phải ảnh chụp",
    "mờ", "thiếu chi tiết", "không sắc nét", "chất lượng thấp", "ảnh cũ", "phai màu", "bộ lọc vintage", "noise", "nhiễu hạt",
    "vẫn còn đen trắng", "vẫn còn màu vàng", "màu sắc cổ điển", "màu sắc nhợt nhạt", "ảnh màu nâu đỏ", "ảnh ngả vàng", "tông màu cổ điển", "màu bị rửa trôi",
    "vẫn còn chấm trắng", "vẫn còn vết xước", "vẫn còn dấu hiệu của ảnh cũ", "vẫn còn vết bẩn",
    "cháy sáng", "ngược sáng", "mất chi tiết vùng sáng", "vùng trắng xóa", "bầu trời trắng xóa", "bầu trời không chi tiết", "nền mờ", "chi tiết nền không rõ ràng", "cây cối mờ ảo",
    "cửa biến thành bầu trời", "nội thất biến thành ngoài trời",
    "da nhựa", "da sáp", "quá mịn", "mất chi tiết da", "hiệu ứng búp bê", "da được airbrush",
    "da xám xịt", "da vàng vọt", "màu da không khỏe mạnh", "da bẩn",
    "tóc bết", "tóc là một khối đen", "tóc không có sợi", "tóc mờ",
    "xóa nền", "chủ thể bị cắt rời",
    "sai giải phẫu", "tay biến dạng", "chân biến dạng", "mất tay", "mất chân", "tay không hoàn chỉnh", "bàn tay được tái tạo kém",
    "thừa ngón tay", "thiếu ngón tay", "sáu ngón tay", "bốn ngón tay", "ngón tay hợp nhất",
    "tư thế không tự nhiên", "vị trí tay vô lý", "tay lơ lửng", "tay bị xoắn",
    "già hơn tuổi thật", "thêm nếp nhăn", "vết chân chim", "làm cho già đi",
    "thêm râu", "râu không có thật",
    "đặc điểm Tây hóa",
    "tạo nốt ruồi giả", "vết bẩn thành nốt ruồi", "đốm đen trên mặt", "giữ lại vết bẩn trên mặt"
  ]
}`,
  oneClickFixLighting: 'Sửa ánh sáng',
  oneClickBoostColor: 'Tăng màu sắc',
  oneClickBoostColorPrompt: `**AI TASK: Semantic Color Enhancement v4.1**

Your primary goal is to intelligently and realistically enhance the colors in the image by first understanding its content. You must perform a semantic analysis to identify different regions and apply context-specific adjustments. The final result should be vibrant and punchy, but still natural and believable.

**EXECUTION PROTOCOL (Strict Order):**

1.  **Semantic Segmentation:** Analyze the image to identify and segment the following key elements:
    *   **People:** Skin, hair, eyes, lips.
    *   **Nature:** Sky, water (lakes, oceans), foliage (trees, grass, plants), flowers.
    *   **Man-made Objects:** Buildings, vehicles, clothing.
    *   **Foreground/Background:** Differentiate between the main subject and the background.

2.  **Context-Aware Color Correction (Apply these rules selectively based on segmentation):**
    *   **Skin Tones (HIGHEST PRIORITY):**
        *   **Target:** The absolute priority is to achieve a 'sáng hồng trong trẻo' (bright, pinkish, clear) look for all skin.
        *   **CRITICAL CONSTRAINT #1 (Luminance):** You are **STRICTLY FORBIDDEN** from making the skin tone darker, deeper, or more saturated in a way that reduces its brightness. The skin MUST appear brighter and clearer than the original, never darker ('đậm'). If the skin looks tan, shadowed, or deep in tone, it is a **CRITICAL FAILURE**.
        *   **CRITICAL CONSTRAINT #2 (Color):** You are **STRICTLY FORBIDDEN** from producing skin that is yellow, sallow, or overly orange. A red, flushed, or sunburnt look is also a **CRITICAL FAILURE**. The goal is a natural pink undertone, not a red cast.
        *   **Method:** Instead of a generic saturation boost, focus on increasing skin's brightness and clarity. Perform color balancing to neutralize unwanted yellow/dull tones and introduce a subtle pinkish hue for a healthy glow.
    *   **Sky:** If a sky is present, deepen the blues. If it's a sunset/sunrise, enhance the oranges, pinks, and purples. Remove any grayish haze.
    *   **Foliage (Greens):** Boost the greens to be lush and vibrant, but avoid a neon or overly-saturated look. Introduce subtle variations in green tones.
    *   **Water:** Enhance blues and cyans for clarity and depth. Add a touch of sparkle to highlights if it looks natural.
    *   **Clothing & Objects:** Increase the saturation and richness of colors on clothing and key objects to make them pop, ensuring the color remains true to the original (e.g., a red car should be a richer red, not turn orange).
    *   **Eyes & Hair:** Subtly enhance the natural color of eyes and the richness of hair tones. Add a hint of catchlight to eyes if it looks natural.

3.  **Global Harmonization:** After applying local adjustments, perform a final global color grading pass. Ensure all the enhanced colors work together harmoniously. Adjust overall saturation and contrast slightly to unify the image.

**CRITICAL CONSTRAINTS:**
- **Naturalism is key.** The final image must not look overly processed or fake.
- **Preserve Identity.** For portraits, the person's identity, including skin tone and features, must be perfectly maintained.
- **No Color Shifting.** Do not change original colors, only enhance them (e.g., a blue shirt should not become purple).`,
  oneClickFixLightingPrompt: `**AI TASK: Advanced Lighting & Atmosphere Correction v2.0**

**Primary Goal:** Analyze the image for complex lighting issues, including atmospheric conditions like haze, fog, or backlighting. Apply corrections to produce a clear, balanced, and dynamic photograph.

**Execution Protocol:**

1.  **Atmospheric Analysis & Correction:**
    *   **Identify Haze/Fog:** First, determine if the image suffers from atmospheric haze or fog that reduces contrast and desaturates colors.
    *   **Dehaze:** If haze is detected, apply an intelligent dehaze algorithm. This must recover deep colors (e.g., rich greens in foliage, deep blues in the sky) and restore contrast without creating artificial halos or color shifts.
    *   **Detail Recovery:** Crucially, focus on recovering fine details that were obscured by the atmospheric conditions.

2.  **Exposure Balancing (Dynamic Range):**
    *   **Highlight Recovery:** Pull back details from any overexposed areas (e.g., bright sky, reflections).
    *   **Shadow Lifting:** Brighten shadowed areas to reveal hidden details, but maintain deep, rich black points to avoid a washed-out look.

3.  **Local Contrast Enhancement (Clarity):**
    *   Apply micro-contrast adjustments to enhance the texture and three-dimensionality of the main subjects and mid-ground elements. This adds "punch" and makes the image pop.

4.  **Final Harmonization:**
    *   Perform a final pass to ensure all adjustments blend seamlessly. The lighting should feel natural and cohesive across the entire image.

**Constraints:**
- The result must look like a professionally corrected photograph, not an overly processed HDR image.
- Avoid introducing noise or artifacts.
- If people are present, their identity must be preserved.`,
  oneClickReconstructForPrint: 'Phục dựng in ấn',
  oneClickReconstructForPrintPrompt: `**NHIỆM VỤ AI: Phục dựng In ấn & Tái tạo Tác phẩm gốc v4.0**

**MỤC TIÊU TỐI THƯỢỢNG (KHÔNG KHOAN NHƯỢNG):**
Nhiệm vụ của bạn là thực hiện một cuộc phục dựng pháp y cấp độ cao, biến một bức ảnh chụp một sản phẩm in ấn (áp phích, trang bìa, ảnh nghệ thuật dán trên cột) thành một tệp kỹ thuật số nguyên sơ của **TÁC PHẨM GỐC**, hoàn toàn sạch sẽ, không có bất kỳ lớp đồ họa, văn bản hay thương hiệu nào, và được nâng cấp lên chất lượng triển lãm.

**QUY TRÌNH THỰC HIỆN (TUẦN TỰ VÀ BẮT BUỘC):**

**BƯỚC 1: NHẬN DIỆN & TÁCH BIỆT HÌNH ẢNH NGUỒN (ƯU TIÊN SỐ 1)**
-   **Hành động:** Quét hình ảnh đầu vào để xác định ranh giới chính xác của "hình ảnh trong hình ảnh" (ví dụ: áp phích trên tường, hình dán trên cột).
-   **Đầu ra:** Một vùng chọn hoàn hảo của hình ảnh nguồn. Đây là khu vực làm việc của bạn.

**BƯỚC 2: PHÂN TÍCH & HIỆU CHỈNH HÌNH HỌC NÂNG CAO (ƯU TIÊN SỐ 2)**
-   **Phân tích Biến dạng Hình học:** Phân tích hình ảnh nguồn để xác định loại biến dạng hình học. Điều này không chỉ giới hạn ở biến dạng phối cảnh đơn giản (do góc chụp) mà còn bao gồm các biến dạng phức tạp hơn như **biến dạng hình trụ (cylindrical distortion)** khi một hình ảnh được dán trên một bề mặt cong như cột, cốc, hoặc chai.
-   **Thực thi "Tháo gỡ" Hình học (Geometric "Unwrapping"):** Dựa trên phân tích, áp dụng phép biến đổi hình học ngược để "tháo gỡ" hoặc "làm phẳng" hình ảnh về dạng 2D gốc của nó. Đối với biến dạng hình trụ, điều này có nghĩa là "trải" hình ảnh ra một cách toán học để nó trở thành một hình chữ nhật hoàn hảo.
-   **Loại bỏ Phản chiếu & Ánh sáng:** Vô hiệu hóa hoàn toàn mọi ánh lóa, phản chiếu, và ám màu từ ánh sáng môi trường. Khôi phục lại ánh sáng và màu sắc gốc, đồng nhất của chính tác phẩm.

**BƯỚC 3: LOẠI BỎ LỚP PHỦ & TÁI TẠO TÁC PHẨM GỐC (BƯỚC QUAN TRỌNG NHẤT)**
-   **Mệnh lệnh (KHÔNG KHOAN NHƯỢNG):** Đây là bước cốt lõi. BẠN BẮT BUỘC phải phân biệt giữa **"Tác phẩm nghệ thuật gốc"** và **"Lớp phủ"** (bao gồm nhưng không giới hạn ở: văn bản, tiêu đề, logo, **mã QR**, ngày tháng, watermark, v.v.).
-   **Hành động:**
    1.  **Xác định Lớp phủ:** Xác định TẤT CẢ các yếu tố không phải là một phần của tác phẩm nghệ thuật gốc.
    2.  **Loại bỏ Hoàn toàn:** Xóa bỏ hoàn toàn các lớp phủ này.
    3.  **Tái tạo Pháp y (Inpainting):** Tái tạo lại một cách pháp y các vùng của tác phẩm nghệ thuật gốc bị che khuất bởi các lớp phủ đó.
-   **Yêu cầu về Phong cách (Tối quan trọng):** Vùng được tái tạo BẮT BUỘC phải **sao chép 1:1 phong cách, nét vẽ, màu sắc, và kết cấu của nghệ sĩ gốc**. Kết quả phải liền mạch và không thể phân biệt được, như thể các lớp phủ đồ họa chưa bao giờ tồn tại.

**BƯỚC 4: HOÀN THIỆN NỘI DUNG & MỞ RỘNG (NẾU CẦN)**
-   **Inpainting (Che khuất bên ngoài):** Nếu có bất kỳ vật thể nào từ môi trường chụp (ví dụ: một góc của một vật khác) che khuất tác phẩm, hãy tái tạo lại phần bị thiếu.
-   **Outpainting (Mở rộng vùng bị cắt):** Nếu tác phẩm gốc bị cắt một phần bởi khung, hãy tái tạo lại các phần bị thiếu một cách logic.

**BƯỚC 5: NÂNG CẤP CHẤT LƯỢNG CHUẨN IN ẤN (HOÀN THIỆN)**
-   **Siêu phân giải & Tái tạo Chi tiết:** Nâng cấp toàn bộ tác phẩm đã được làm sạch lên độ phân giải cực cao (8K). Tái tạo lại các chi tiết vi mô (ví dụ: kết cấu giấy, nét cọ, chi tiết nhỏ trong hình vẽ) để đạt được độ sắc nét tối đa.
-   **Khoa học Màu sắc:** Tái tạo lại màu sắc rực rỡ, chính xác của tác phẩm gốc, tối ưu hóa cho không gian màu Adobe RGB.

**ĐẦU RA CUỐI CÙNG:**
-   Một tệp hình ảnh kỹ thuật số duy nhất, siêu thực, độ phân giải cao của **TÁC PHẨM GỐC**, hoàn toàn không có văn bản, logo, và không bị ảnh hưởng bởi môi trường chụp ảnh.`,
  filterTitle: 'Bộ lọc',
  filterSectionCamera: 'Máy ảnh',
  filterSectionFilm: 'Phim',
  filterSectionArtistic: 'Nghệ thuật',
  filterSectionDigital: 'Kỹ thuật số',
  filterCameraFuji: 'Fuji',
  filterCameraKodak: 'Kodak',
  filterCameraLeica: 'Leica',
  filterCameraCanon: 'Canon',
  filterFilmVintage: 'Cổ điển',
  filterFilmBW: 'Đen trắng',
  filterFilmSepia: 'Nâu đỏ',
  filterFilmPolaroid: 'Polaroid',
  filterArtisticOil: 'Sơn dầu',
  filterArtisticWatercolor: 'Màu nước',
  filterArtisticSketch: 'Phác thảo',
  filterArtisticPopArt: 'Pop Art',
  filterDigitalSynthwave: 'Synthwave',
  filterDigitalGlitch: 'Glitch',
  filterDigitalDuotone: 'Duotone',
  filterDigitalPixel: 'Pixel Art',
  filterPlaceholder: 'Mô tả bộ lọc hoặc hiệu ứng của riêng bạn...',
  applyFilter: 'Áp dụng',
  orSeparator: 'hoặc',
  enhanceTitle: 'Nâng cao',
  adjustmentPreset1: 'Làm mờ nền',
  adjustmentPortraitPreset1: 'Làm mịn da',
  adjustmentPortraitPreset2: 'Thêm nụ cười',
  adjustmentOpenEyes: 'Mở mắt',
  adjustmentStraightenPosture: 'Làm thẳng tư thế',
  adjustmentWhitenTeeth: 'Làm trắng răng',
  adjustmentRemoveBg: 'Xóa nền',
  adjustmentUpscale8K: 'Nâng cấp 8K',
  adjustmentUpscale8KPrompt: `{
  "phiên_bản": "24.0-ADAPTIVE_SUPER_RESOLUTION-8K-V43.0-PHOTOREALISM_LOCK",
  "Mệnh lệnh Tối cao Ghi đè (OVERRIDE SUPREME MANDATE)": {
    "policy": "PHOTOGRAPHIC_REALITY_LOCK_ZERO_TOLERANCE",
    "directive": "MỆNH LỆNH THỰC TẾ ẢNH CHỤP (PHOTOGRAPHIC REALISM MANDATE)",
    "description": "Đây là mệnh lệnh quan trọng nhất, ghi đè lên mọi xu hướng sáng tạo hoặc diễn giải nghệ thuật. Kết quả cuối cùng BẮT BUỘC phải là một BỨC ẢNH, không phải là một tác phẩm nghệ thuật kỹ thuật số. Nhiệm vụ của bạn là NÂNG CẤP DỮ LIỆU ẢNH HIỆN CÓ, không phải vẽ lại nó.",
    "mandate": [
      "1. **Không phải Tranh vẽ:** Kết quả cuối cùng BẮT BUỘC phải không thể phân biệt được với một bức ảnh có độ phân giải cực cao được chụp bằng máy ảnh chuyên nghiệp. CẤM TUYỆT ĐỐI bất kỳ dấu hiệu nào của tranh vẽ kỹ thuật số, kết xuất 3D, hoặc phong cách minh họa.",
      "2. **Nâng cấp, không Vẽ lại:** Bạn BẮT BUỘC phải làm sắc nét và tái tạo chi tiết dựa trên các pixel và cấu trúc hiện có trong ảnh gốc. CẤM TUYỆT ĐỐI việc 'vẽ lại' hoặc 'tưởng tượng lại' chủ thể từ đầu. Mục tiêu là một phiên bản sắc nét hơn của bức ảnh gốc, không phải là một bức chân dung mới.",
      "3. **Kết cấu Ảnh chụp:** Mọi chi tiết được tái tạo (kết cấu da, sợi vải, sợi tóc) phải có vẻ ngoài tự nhiên, không hoàn hảo của một bức ảnh thực, không phải là sự hoàn hảo của một kết xuất đồ họa."
    ],
    "failure_condition": "THẤT BẠI NGHIÊM TRỌNG: Kết quả trông giống như một bức tranh, hình minh họa, hoặc có vẻ được 'vẽ lại' thay vì là một bức ảnh được nâng cấp."
  },
  "Mục tiêu chính": "Thực thi CÔNG CỤ SIÊU PHÂN GIẢI & TÁI TẠO CHI TIẾT v2.0 để biến đổi hình ảnh đầu vào thành một bức ảnh kỹ thuật số 8K, chất lượng như ảnh chụp, trong trẻo và sống động.",
  "Mệnh lệnh Đồng nhất Toàn bộ Ảnh (ZERO-TOLERANCE)": {
    "policy": "PRIORITY_OVERRIDE_MANDATE",
    "description": "CẤM TUYỆT ĐỐI việc chỉ phục hồi khuôn mặt và bỏ qua phần còn lại của ảnh. Toàn bộ ảnh — chủ thể, quần áo, tóc, nền, và mọi chi tiết từ tiền cảnh đến hậu cảnh — BẮT BUỘC phải được phục hồi và nâng cấp với cùng một mức độ chi tiết và sắc nét. Điều này đặc biệt quan trọng đối với ảnh chụp toàn thân và ảnh phong cảnh.",
    "failure_condition": "THẤT BẠI NGHIÊM TRỌNG: Khuôn mặt sắc nét hơn đáng kể so với quần áo, tóc, hoặc nền."
  },
  "bước_0_phân_loại_ảnh_và_chiến_lược_thích_ứng": {
    "policy": "BẮT_BUỘC_VÀ_QUAN_TRỌNG_NHẤT",
    "description": "Trước khi thực hiện bất kỳ hành động nào, bạn BẮT BUỘC phải phân loại hình ảnh đầu vào và chọn một trong các chiến lược nâng cấp sau đây. Việc áp dụng sai chiến lược là một THẤT BẠI NGHIÊM TRỌNG.",
    "CHIẾN_LƯỢC_A_CHÂN_DUNG_CẬN_CẢNH": {
      "điều_kiện": "Ảnh chụp chủ yếu là khuôn mặt và vai của một hoặc nhiều người.",
      "trọng_tâm_thực_hiện": "Tập trung tối đa vào các chi tiết vi mô trên khuôn mặt, tóc và da như đã mô tả trong phần 'chỉnh sửa'. Nền có thể được làm mờ nhẹ một cách tự nhiên (bokeh) để làm nổi bật chủ thể, trừ khi nền cũng có các chi tiết quan trọng."
    },
    "CHIẾN_LƯỢC_B_TOÀN_THÂN_VÀ_ẢNH_NHÓM": {
      "điều_kiện": "Ảnh chụp toàn bộ cơ thể của một hoặc nhiều người, thấy rõ từ đầu đến chân.",
      "trọng_tâm_thực_hiện": "Áp dụng Mệnh lệnh Đồng nhất Toàn bộ Ảnh một cách tuyệt đối. Chi tiết trên khuôn mặt phải được nâng cấp (theo quy tắc trong phần 'chỉnh sửa'), nhưng phải dành sự quan tâm tương đương để tái tạo kết cấu của TOÀN BỘ trang phục, giày dép, và các bề mặt mà họ đang đứng hoặc tương tác. Độ sắc nét phải đồng đều từ đầu đến chân. CẤM TUYỆT ĐỐI việc chỉ làm nét khuôn mặt và bỏ qua phần còn lại của cơ thể và trang phục."
    },
    "CHIẾN_LƯỢC_C_PHONG_CẢNH_VÀ_KIẾN_TRÚC": {
      "điều_kiện": "Ảnh chụp chủ yếu là cảnh quan thiên nhiên, thành phố, hoặc kiến trúc, có thể có hoặc không có người ở xa.",
      "trọng_tâm_thực_hiện": "Tập trung vào việc làm sắc nét toàn bộ khung hình (edge-to-edge sharpness). Tái tạo chi tiết của các yếu tố tự nhiên (lá cây, kết cấu đá, gợn nước) và nhân tạo (kết cấu gạch, cửa sổ). Loại bỏ sương mù (dehaze) để tăng độ trong và chiều sâu. Nếu có người trong ảnh, chỉ nâng cấp họ như một phần của cảnh quan tổng thể, không cần tập trung quá mức vào chi tiết khuôn mặt trừ khi họ là chủ thể chính."
    }
  },
  "bước_1_xoay_khung_hình_bắt_buộc": {
    "policy": "BẮT_BUỘC_VÀ_ƯU_TIÊN_HÀNG_ĐẦU",
    "description": "Phân tích và xoay TOÀN BỘ KHUNG HÌNH để đảm bảo hướng thẳng đứng chính xác."
  },
  "bước_2_sửa_phối_cảnh_và_làm_thẳng_bắt_buộc": {
    "policy": "BẮT_BUỘC_SAU_KHI_XOAY",
    "description": "Xác định bốn góc của tờ giấy ảnh gốc và thực hiện một phép biến đổi phối cảnh để làm cho nó hoàn toàn hình chữ nhật và thẳng."
  },
  "bước_3_tách_nền_và_cắt_cúp_thông_minh": {
    "policy": "ZERO_TOLERANCE_NON-NEGOTIABLE_REQUIREMENT",
    "description": "Cắt cúp một cách hoàn hảo để LOẠI BỎ TOÀN BỘ môi trường xung quanh tờ giấy ảnh (ví dụ: mặt bàn, tay người cầm).",
    "mandate": "Kết quả cuối cùng CHỈ ĐƯỢỢC PHÉP chứa nội dung BÊN TRỌNG bức ảnh gốc đã được làm thẳng."
  },
  "bước_4_xử_lý_nền_tuyệt_đối": {
    "policy": "ZERO_TOLERANCE_FORENSIC_BACKGROUND_PROTOCOL",
    "description": "Phân tích nền gốc sau khi cắt cúp. Quy tắc này là tuyệt đối.",
    "rule_A_plain_background": "MỆNH LỆNH KHÔNG KHOAN NHƯỢNG: Nếu nền gốc là một phông nền đơn giản, trống trơn, hoặc kiểu studio, BẠN BẮT BUỘC phải thay thế nó bằng một phông nền studio hoàn toàn sạch sẽ, đồng nhất (xám trung tính hoặc xanh dương). CẤM TUYỆT ĐỐI, và coi là THẤT BẠI NGHIÊM TRỌNG, việc 'sáng tạo' hoặc thêm bất kỳ yếu tố nào vào nền này (KHÔNG CÓ hoa, cây cối, nhà cửa, con đường, bầu trời, mây).",
    "rule_B_scene_background": "CHỈ KHI nền gốc chứa một cảnh vật thực tế, BẠN MỚI ĐƯỢỢC phép phục hồi và nâng cao chi tiết của cảnh vật đó. KHÔNG ĐƯỢỢC thay đổi các yếu tố chính của cảnh."
  },
  "mô_phỏng_máy_ảnh": {
    "brand_model": "Sony A7R V",
    "look": "Siêu sắc nét, màu sắc HDR trong trẻo và sống động, chi tiết vi mô cực cao, không nhiễu hạt (low ISO)."
  },
  "ràng_buộc_chủ_thể": {
    "description": "Tuân thủ GIAO THỨC BẢO TOÀN DANH TÍNH LÕI v41.0 được chèn vào."
  },
  "chỉnh sửa": {
    "phục_hồi_chi_tiết_hư_hỏng": {
      "policy": "forensic_level_damage_reconstruction_ZERO_TOLERANCE",
      "strength": "cực cao",
      "targets": ["scratches", "tears", "creases", "stains", "white_dots", "color_fading", "digital_noise", "blur"],
      "method": "Loại bỏ tất cả các khuyết điểm một cách toàn diện."
    },
    "da": {
      "tái_tạo_khối_3d_cho_khuôn_mặt": {
        "policy": "MANDATORY_FACIAL_RE_LIGHTING_FOR_VOLUME",
        "mandate": "TÁI TẠO lại ánh sáng trên khuôn mặt để tạo cảm giác chiều sâu 3D (nổi khối)."
      },
      "chống_hiện_vật_ai_bắt_buộc": "TÁI TẠO và NÂNG CAO kết cấu da tự nhiên. CẤM da 'nhựa'.",
      "giao_thức_phân_tích_da_pháp_y": {
        "policy": "GIAO_THỨC_PHÂN_TÍCH_DA_PHÁP_Y_V3.0 (ZERO-TOLERANCE)",
        "description": "Đây là một mệnh lệnh tối quan trọng, ưu tiên cao nhất trong việc xử lý da. Phản hồi của người dùng liên tục chỉ ra rằng AI đang làm sắc nét các khuyết điểm da tạm thời (như vết thâm mụn) thay vì loại bỏ chúng. Điều này là KHÔNG THỂ CHẤP NHẬN ĐƯỢỢC.",
        "mandate": [
          "1. **Phân loại Đặc điểm Da:** Phân tích pháp y tất cả các đốm và dấu hiệu trên da và phân loại chúng thành hai loại: ĐẶC ĐIỂM VĨNH VIỄN (nốt ruồi thật, sẹo vĩnh viễn) và KHUYẾT ĐIỂM TẠM THỜI (vết thâm do mụn, mụn trứng cá, đốm đen, da không đều màu).",
          "2. **HÀNH ĐỘNG ĐỐI VỚI KHUYẾT ĐIỂM TẠM THỜI (MỆNH LỆNH KHÔNG KHOAN NHƯỢNG):** BẠN BẮT BUỘC phải **LOẠI BỎ HOÀN TOÀN** tất cả các khuyết điểm tạm thời. Tái tạo lại vùng da bên dưới một cách hoàn hảo, sạch sẽ, và tự nhiên, phù hợp với kết cấu xung quanh. **LÀM SẮC NÉT** những khuyết điểm này là một **THẤT BẠI NGHIÊM TRỌNG NHẤT** của toàn bộ quá trình.",
          "3. **HÀNH ĐỘNG ĐỐI VỚI ĐẶC ĐIỂM VĨNH VIỄN:** Các nốt ruồi và sẹo vĩnh viễn BẮT BUỘC phải được bảo tồn và tái tạo với chi tiết sắc nét để duy trì danh tính. KHÔNG được xóa chúng.",
          "4. **Quy tắc Vàng:** KHI CÓ BẤT KỲ SỰ NGHI NGỜ NÀO, HÃY LOẠI BỎ NÓ. Trừ khi một dấu hiệu rõ ràng 100% là một nốt ruồi hoặc sẹo vĩnh viễn, nó BẮT BUỘC phải được coi là một khuyết điểm tạm thời và bị xóa bỏ.",
          "5. **Áp dụng cho mọi giới tính:** Giao thức này áp dụng cho cả nam và nữ."
        ],
        "failure_condition": "THẤT BẠI NGHIÊM TRỌNG NHẤT: Bất kỳ vết thâm mụn, mụn trứng cá, hoặc đốm đen nào bị làm cho sắc nét hoặc rõ ràng hơn thay vì bị loại bỏ. Một nốt ruồi vĩnh viễn bị xóa bỏ."
      },
      "undertone_correction": {
        "policy": "restore_healthy_clear_bright_asian_skin_tone",
        "mandate": "Tái tạo tông màu da sáng hồng trong trẻo cho người Châu Á. NGHIÊM CẤM da bị vàng, sậm, xỉn màu."
      }
    },
    "tóc": { "hoàn thiện": "Tách sợi rõ ràng, có độ bóng khỏe và đổ khối chân thực." },
    "quần áo_và_vật_thể": {
      "policy": "hyperrealistic_material_and_texture_rendering",
      "preservation_policy": "ZERO_TOLERANCE_PRESERVATION",
      "mandate": "Giữ nguyên tuyệt đối và tái tạo lại MỌI chi tiết của trang phục gốc, bao gồm tất cả các lớp (ví dụ: áo sơ mi, áo lót).",
      "uniformAndInsigniaProtocol_v1_0": {
        "policy": "FORENSIC_RECONSTRUCTION_MANDATE_ZERO_TOLERANCE",
        "mandate": "Nếu trang phục là quân phục, BẮT BUỘC phải tái tạo lại một cách pháp y TẤT CẢ các quân hàm (ví dụ: sao, vạch) với độ chính xác tuyệt đối."
      }
    }
  },
  "ánh sáng_và_màu_sắc": {
    "khử_ám_màu": { "policy": "auto_neutralize_color_casts", "strength": "cực cao" },
    "ánh sáng": {
      "thiết lập": "ánh sáng tự nhiên, cân bằng, rõ ràng.",
      "white_balance": "trung tính chính xác (5500K)"
    },
    "chỉnh_màu": { "vibrance": "tăng đáng kể", "saturation": "tăng nhẹ" }
  },
  "hậu_kỳ": {
    "sharpening": { "policy": "adaptive_frequency_selective_sharpening_extreme_detail" },
    "micro_contrast": "cực cao"
  },
  "đầu ra": { "độ phân giải": "7680x4320", "dpi": 300 },
  "negative_prompt": [
    "tranh vẽ", "ảnh vẽ", "minh họa", "kết xuất 3D", "phong cách nghệ thuật", "vẽ lại", "không phải ảnh chụp",
    "ghép cảnh", "phong cách ảnh thờ", "thêm hoa vào nền", "thêm nhà vào nền", "thêm cây vào nền", "tạo nền mới hoàn toàn", "phông nền nhân tạo",
    "da nhựa", "da sáp", "quá mịn", "hiệu ứng tranh vẽ",
    "thay đổi tỷ lệ khuôn mặt", "mặt béo", "khuôn mặt đối xứng hoàn hảo", "làm cho khuôn mặt đối xứng",
    "thay đổi chiều dài cằm", "làm ngắn cằm",
    "đóng miệng đang hé", "thay đổi biểu cảm miệng",
    "màu sắc không chân thực", "ánh sáng phẳng", "màu sắc nhợt nhạt", "mờ",
    "ảnh ám vàng", "ảnh ám nâu đỏ", "vẫn còn vết xước",
    "mất áo lót", "mất quân hàm",
    "tạo nốt ruồi giả", "vết bẩn thành nốt ruồi", "đốm đen trên mặt", "giữ lại vết bẩn trên mặt",
    "làm nét vết thâm", "làm nét mụn", "giữ lại khuyết điểm da",
    "nhiễu hạt", "noise", "artifacts", "tạo thêm nhiễu hạt", "kết cấu không tự nhiên", "vỡ hạt", "chất lượng thấp"
  ]
}`,
  adjustmentFaceRestore: 'Phục hồi khuôn mặt',
  adjustmentFaceRestorePrompt: 'Thực hiện một quá trình phục hồi pháp y trên tất cả các khuôn mặt trong ảnh. Tăng cường độ rõ nét, làm sắc nét các đặc điểm và tái tạo lại các chi tiết bị mất do chất lượng ảnh kém hoặc mờ. QUAN TRỌNG: Tuân thủ nghiêm ngặt Giao thức Tích hợp Danh tính Động v11.2. Không được làm đẹp, lý tưởng hóa hoặc thay đổi danh tính của người đó. Bạn phải bảo tồn hình khối ba chiều tự nhiên của khuôn mặt và không được làm phẳng mặt. Kết quả phải là cùng một người, chỉ với khuôn mặt rõ nét hơn nhiều.',
  adjustmentPlaceholder: 'Mô tả điều chỉnh của bạn (ví dụ: "làm cho nền tối hơn")...',
  applyAdjustment: 'Áp dụng',
  idPhotoTitle: 'Ảnh thẻ',
  idPhotoDescription: 'Tạo ảnh thẻ chuyên nghiệp tuân thủ các tiêu chuẩn.',
  idPhotoType: 'Loại ảnh',
  idPhotoTypeStandard: 'Tiêu chuẩn',
  idPhotoTypeNewborn: 'Trẻ sơ sinh',
  idPhotoGender: 'Giới tính',
  idPhotoGenderMale: 'Nam',
  idPhotoGenderFemale: 'Nữ',
  idPhotoExpression: 'Biểu cảm',
  idPhotoExpressionKeep: 'Giữ nguyên',
  idPhotoExpressionNeutral: 'Nghiêm túc',
  idPhotoExpressionSmile: 'Cười mỉm',
  idPhotoExpressionBigSmile: 'Cười tươi',
  idPhotoOutfit: 'Trang phục',
  idPhotoOutfitSuit: 'Vest',
  idPhotoOutfitBlouse: 'Áo sơ mi nữ',
  idPhotoOutfitCollaredShirtM: 'Áo sơ mi nam',
  idPhotoOutfitCollaredShirtF: 'Áo công sở nữ',
  idPhotoOutfitAoDai: 'Áo dài',
  idPhotoOutfitOfficeWear: 'Đồ công sở',
  idPhotoHairstyle: 'Kiểu tóc',
  idPhotoHairKeep: 'Giữ nguyên',
  idPhotoHairShortNeat: 'Tóc ngắn gọn gàng',
  idPhotoHairTiedBack: 'Tóc buộc cao',
  idPhotoHairNeatDown: 'Tóc xõa gọn gàng',
  idPhotoHairMaleNeat: 'Tóc nam gọn gàng',
  idPhotoHairMaleShort: 'Tóc nam ngắn',
  idPhotoHairMaleMedium: 'Tóc nam vừa',
  idPhotoBackgroundColor: 'Màu nền',
  idPhotoBgWhite: 'Trắng',
  idPhotoBgBlue: 'Xanh',
  idPhotoBgGray: 'Xám',
  idPhotoBgGreen: 'Xanh lá',
  idPhotoSize: 'Kích cỡ',
  idPhotoApply: 'Tạo ảnh thẻ',
  idPhotoNewbornInfo: 'Đối với ảnh trẻ sơ sinh, chỉ có các tùy chọn nền và kích cỡ được áp dụng để đảm bảo tuân thủ các quy định.',
  idPhotoCustomPromptLabel: 'Yêu cầu tùy chỉnh (Tùy chọn)',
  idPhotoCustomPromptPlaceholder: 'ví dụ: "thêm một chút tóc mái"',
  expandTitle: 'Mở rộng',
  expandDescription: 'Kéo các cạnh để mở rộng ảnh của bạn, sau đó mô tả những gì cần thêm vào.',
  expandPlaceholder: 'Mô tả cảnh (ví dụ: "một bãi biển đầy nắng")...',
  expandApply: 'Tạo',
  expandMagic: 'Tự động',
  expandAspectFree: 'Tự do',
  remove: 'Xóa',
  extractTitle: 'Trích xuất',
  extractDescription: 'Mô tả một vật thể trong ảnh để trích xuất nó với nền trong suốt.',
  extractPlaceholder: 'ví dụ: "chiếc mũ đỏ", "người phụ nữ mặc váy xanh"',
  extractApply: 'Trích xuất',
  extractResultTitle: 'Vật thể đã trích xuất',
  extractHistoryTitle: 'Lịch sử trích xuất',
  extractClearHistory: 'Xóa lịch sử',
  extractUseAsStyle: 'Dùng làm Phong cách',
  extractUseAsOutfit: 'Dùng làm Trang phục',
  suggestionTitle: 'Đề xuất:',
  suggestionRestoreFace: 'Phục hồi khuôn mặt',
  suggestionFixLighting: 'Sửa ánh sáng',
  suggestionPortraitTools: 'Công cụ chân dung',
  suggestionDismiss: 'Bỏ qua',
  historyOriginal: 'Ảnh gốc',
  historyStep: 'Bước {step}',
  historyCurrent: 'Hiện tại',
  studioTitle: 'Studio',
  studioDescription: 'Tạo buổi chụp ảnh chuyên nghiệp hoặc ghép nhiều người từ các ảnh khác nhau vào một cảnh.',
  studioPromptPlaceholder: 'ví dụ: "chụp ảnh thời trang cổ điển thập niên 90", "ảnh chân dung công sở"',
  studioPromptPlaceholderStyle: 'Lệnh sẽ được tạo từ ảnh phong cách.',
  studioCameraAngle: 'Góc máy ảnh',
  studioAngleFront: 'Chính diện',
  studioAngle34Left: 'Góc 3/4 trái',
  studioAngle34Right: 'Góc 3/4 phải',
  studioAngleProfileLeft: 'Nhìn nghiêng trái',
  studioAngleProfileRight: 'Nhìn nghiêng phải',
  studioAngleAbove: 'Góc cao',
  studioAngleBelow: 'Góc thấp',
  generatePhotoshoot: 'Tạo bộ ảnh',
  studioSelectResult: 'Chọn kết quả này',
  studioDownloadResult: 'Tải xuống',
  studioStyleInfluenceLabel: 'Mức độ ảnh hưởng phong cách',
  studioObjects: 'Vật thể (Tùy chọn)',
  studioSubjects: 'Chủ thể',
  studioSubjectsCount: 'Chủ thể ({count}/{max})',
  // Fix: Added missing translation key for 'Studio Style' section label.
  studioStyle: 'Phong cách',
  studioAddSubject: 'Thêm chủ thể',
  tooltipRetouch: 'Chỉnh sửa & Trích xuất',
  tooltipAdjust: 'Nâng cao & Bộ lọc',
  tooltipIdPhoto: 'Ảnh thẻ',
  tooltipExpand: 'Mở rộng',
  tooltipExtract: 'Trích xuất',
  tooltipStudio: 'Studio',
  zoomIn: 'Phóng to',
  zoomOut: 'Thu nhỏ',
  resetZoom: 'Đặt lại thu phóng',
  viewOriginal: 'So sánh',
  viewEdited: 'Xem ảnh đã sửa',
  transformRotateCW: 'Xoay phải',
  transformRotateCCW: 'Xoay trái',
  transformFlipH: 'Lật ngang',
  transformFlipV: 'Lật dọc',
  compareSliderAria: 'Thanh trượt so sánh',
  bottomToolbarOpenFullEditor: 'Mở trình chỉnh sửa đầy đủ',
  retouchRemovePersonPrompt: 'XÓA NGƯỜI: Vui lòng xóa (các) người trong vùng được chỉ định. Tái tạo lại nền một cách siêu thực. Kết quả phải hoàn toàn liền mạch và trông như thể (các) người đó chưa bao giờ ở đó.',
  retouchRemoveObjectPrompt: 'XÓA VẬT THỂ: Vui lòng xóa đối tượng trong vùng được chỉ định. Tái tạo lại nền một cách siêu thực. Kết quả phải hoàn toàn liền mạch và trông như thể đối tượng đó chưa bao giờ ở đó.',
  retouchRemoveReflectionPrompt: 'XÓA PHẢN CHIẾU: Vui lòng xóa ánh sáng phản chiếu/lóa trong vùng được chỉ định. Tái tạo lại các chi tiết cơ bản một cách siêu thực. Kết quả phải hoàn toàn liền mạch.',
  adjustmentPortraitTitle: 'Chân dung',
  filterSectionColor: 'Màu sắc',
  filterColorCinematic: 'Điện ảnh',
  adjustmentPortraitSmoothSkinPrompt: `{"task": "Apply gentle, natural-looking skin smoothing. Preserve skin texture like pores. Do not make it look plastic or airbrushed."}`,
  adjustmentOpenEyesPrompt: `{"task": "If the subject's eyes are partially closed, gently open them slightly. The result must look natural and not distorted."}`,
  adjustmentWhitenTeethPrompt: `{"task": "Naturally whiten the teeth if they are visible and yellowed. Avoid an overly bright, artificial look."}`,
  adjustmentPortraitBlurBgPrompt: `{"task": "Apply a realistic background blur (bokeh) to separate the subject from the background, simulating a shallow depth of field from a professional portrait lens."}`,
  adjustmentRemoveBgPrompt: `{"task": "Accurately remove the background, leaving only the main subject(s). The cutout should be clean with well-defined edges."}`,
  adjustmentSlimChinAndNeck: 'Làm gọn cằm & cổ',
  adjustmentSlimChinAndNeckPrompt: `{"task": "Perform a subtle and realistic slimming of the chin, jawline, and neck area. Remove any appearance of a double chin or excess sagging neck fat. The result must look natural, create a defined jawline, and preserve the person's identity."}`,
  adjustmentNaturalSmile: 'Nụ cười tự nhiên',
  adjustmentNaturalSmilePrompt: `{"task": "Thực hiện điều chỉnh nụ cười một cách thông minh và theo ngữ cảnh. Đầu tiên, hãy phân tích biểu cảm khuôn mặt hiện tại của chủ thể.", "rules": [{"condition": "Chủ thể đang cười.", "action": "Tinh chỉnh một cách tinh tế nụ cười hiện có để trông tự nhiên, dễ chịu và chân thật hơn. Sửa lại bất kỳ nụ cười toe toét nào không tự nhiên, căng cơ khó xử hoặc biểu cảm gượng gạo. Mục tiêu là một nụ cười thoải mái và chân thực."}, {"condition": "Chủ thể không cười (biểu cảm trung tính, buồn, hoặc khác).", "action": "Thêm một nụ cười nhẹ nhàng, tự nhiên và phù hợp. Nụ cười mới phải tinh tế và phù hợp với cấu trúc khuôn mặt và tuổi tác của người đó. Phân tích bối cảnh của bức ảnh để xác định mức độ cười phù hợp. Một nụ cười gượng gạo hoặc 'dán vào' là một THẤT BẠI NGHIÊM TRỌNG."}], "mandate": "Kết quả cuối cùng BẮT BUỘC phải trông hoàn toàn thực tế và bảo toàn danh tính cốt lõi của người đó. Không thay đổi hình dạng cơ bản của khuôn mặt, mắt hoặc mũi."}`,
  filterColorCinematicPrompt: `Apply a cinematic color grade. Enhance teals and oranges, add subtle grain, and adjust contrast for a filmic look.`,
  filterColorVibrant: 'Rực rỡ',
  filterColorVibrantPrompt: `**AI TASK: Semantic Vibrant Color Enhancement v5.1**

**Primary Goal:** Dramatically boost the vibrancy of the image to make colors pop, while maintaining exceptionally natural and beautiful skin tones.

**Execution Protocol (Strict Order):**

1.  **Semantic Segmentation:** First, identify and separate 'human subjects' from the 'environment' (clothing, backgrounds, nature, etc.).

2.  **Environment Color Boost:** Apply a strong vibrancy and saturation boost to all non-skin elements. Make skies bluer, greens lusher, and clothing colors richer.

3.  **Skin Tone Perfection (HIGHEST PRIORITY):** This is the most critical step.
    *   **Target:** The goal is 'sáng hồng trong trẻo' (bright, pinkish, clear) skin. Skin must look healthy, bright, and translucent with a subtle, natural pink undertone.
    *   **CRITICAL CONSTRAINT #1 (Luminance):** You are **STRICTLY FORBIDDEN** from making the skin tone darker, deeper, or more saturated in a way that reduces its brightness. The skin MUST appear brighter and clearer than the original, never darker ('đậm'). If the skin looks tan, shadowed, or deep in tone, it is a **CRITICAL FAILURE**.
    *   **CRITICAL CONSTRAINT #2 (Color):** You are **STRICTLY FORBIDDEN** from making skin tones overly red or magenta. The "hồng" (pinkish) aspect refers to a healthy glow, not a red color cast. If the skin looks flushed or sunburned, it is a **CRITICAL FAILURE**.
    *   **Method:** Instead of a simple saturation boost, perform a color balance correction on the skin. **Your primary action on skin should be to INCREASE its brightness and clarity.** Neutralize any yellow or dull tones, and then introduce a very subtle pinkish hue to achieve the desired healthy look. The effect should be delicate and realistic.

4.  **Final Harmonization:** Blend the enhanced environment and perfected skin tones together seamlessly for a cohesive final image.`,
  filterColorGolden: 'Ánh vàng',
  filterColorGoldenPrompt: `Apply a warm, golden-hour-like color cast to the image for a soft and pleasing feel.`,
  filterColorMoody: 'Tâm trạng',
  filterColorMoodyPrompt: `Create a moody atmosphere by desaturating some colors, deepening shadows, and adding a cool or dark color cast.`,
  filterCameraFujiPrompt: `Simulate the look of a classic Fuji film stock, known for its beautiful greens and skin tones.`,
  filterCameraKodakPrompt: `Simulate the look of a classic Kodak film stock, known for its warmth and rich colors.`,
  filterCameraLeicaPrompt: `Simulate the look of a Leica camera, known for its sharp, high-contrast, and classic rendering.`,
  filterCameraCanonPrompt: `Simulate the look of a Canon digital camera, known for its pleasing and accurate color science.`,
  filterFilmVintagePrompt: `Apply a vintage film effect with faded colors, reduced contrast, and possibly some light leaks or grain.`,
  filterFilmBWPrompt: `Convert the image to a high-contrast, classic black and white.`,
  filterFilmSepiaPrompt: `Apply a classic sepia tone for an old-fashioned look.`,
  filterFilmPolaroidPrompt: `Simulate the look of a Polaroid photo with its characteristic color shifts, soft focus, and frame.`,
  filterArtisticOilPrompt: `Transform the photo to look like an oil painting with visible brush strokes.`,
  filterArtisticWatercolorPrompt: `Transform the photo to look like a watercolor painting.`,
  filterArtisticSketchPrompt: `Transform the photo to look like a pencil or charcoal sketch.`,
  filterArtisticPopArtPrompt: `Apply a Pop Art effect, similar to the style of Andy Warhol, using bold, vibrant colors.`,
  filterDigitalSynthwavePrompt: `Apply a synthwave or retrowave aesthetic with neon pinks, purples, and cyans, and a retro 80s feel.`,
  filterDigitalGlitchPrompt: `Introduce digital glitch artifacts for a distorted, modern artistic effect.`,
  filterDigitalDuotonePrompt: `Apply a duotone effect using two contrasting colors.`,
  filterDigitalPixelPrompt: `Pixelate the image to give it a retro video game or pixel art look.`,
  hideTools: 'Ẩn công cụ',
  showTools: 'Hiện công cụ',
  uploadNew: 'Tải ảnh mới',
  undo: 'Hoàn tác',
  redo: 'Làm lại',
  reset: 'Thiết lập lại',
  downloadImage: 'Tải xuống',
  startOver: 'Bắt đầu lại',
};

// Fix: Export translations and TranslationKey to make this file a module.
export const translations = {
  vi,
};

export type TranslationKey = keyof typeof vi;