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
  errorFailedToProcessImage: 'Không thể xử lý ảnh.',
  errorFailedToExtract: 'Không thể trích xuất vật thể.',
  errorFailedToCleanBackground: 'Không thể xóa người khỏi ảnh nền.',
  errorRateLimit: 'Bạn đã thực hiện quá nhiều yêu cầu trong thời gian ngắn. Vui lòng đợi một lát và thử lại.',
  errorFailedToExport: 'Không thể xuất tài liệu.',
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
  loadingScan: 'Đang quét tài liệu của bạn...',
  loadingExtract: 'Đang trích xuất vật thể...',
  loadingCleanBackground: 'Đang làm sạch nền...',
  loadingTransform: 'Đang áp dụng chuyển đổi...',
  loadingStyle: 'Đang phân tích phong cách...',
  loadingTranslate: 'Đang phân tích yêu cầu...',
  loadingStudioAnalysis: 'Đang tạo kịch bản chụp ảnh...',
  loadingAnalyzingScene: 'Đang phân tích ảnh để tạo bối cảnh...',
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
  oneClickAutoEnhancePrompt: `{
  "phiên bản": "7.1-PRO-HDR-ENHANCE",
  "nhiệm vụ": "Nhiệm vụ Tối thượng: Nâng cấp ảnh kỹ thuật số. Mục tiêu là biến một bức ảnh thông thường (kể cả ảnh thiếu sáng, mờ, nhiễu) thành một bức ảnh hiện đại, siêu thực với màu sắc HDR sống động và độ trong trẻo cao, như được chụp bằng máy ảnh kỹ thuật số cao cấp. Phải tái tạo màu sắc sống động như thật, khôi phục chi tiết vi mô bị mất, và tạo độ sâu 3D nổi khối cho ảnh.",
  "notes": "Phiên bản này tập trung vào 'Chủ nghĩa Hiện thực Tuyệt đối với HDR'. AI phải: 1. **Tái tạo Màu sắc HDR Sống động**: Màu da, tóc, mắt, quần áo và nền phải rực rỡ, có dải tương phản động rộng và chính xác như ngoài đời thực. 2. **Khôi phục Chi tiết Cực cao**: Loại bỏ hoàn toàn nhiễu và mờ, tái tạo các chi tiết nhỏ nhất như lỗ chân lông, sợi tóc, vân vải. 3. **Tạo Độ sâu 3D**: Sử dụng ánh sáng và đổ bóng tinh vi để tạo cảm giác 'nổi khối', chiều sâu và sự hiện diện cho chủ thể.",
  "mô_phỏng_máy_ảnh": {
    "brand_model": "Sony A7R V",
    "ống kính": "FE 50mm f/1.2 GM",
    "look": "Siêu sắc nét, màu sắc HDR sống động và trong trẻo, chi tiết vi mô cực cao, không gắt.",
    "settings": { "aperture": "f/1.8", "iso": 100, "bokeh_quality": "creamy_and_smooth" }
  },
  "kiểm_soát_màu_sắc_vật_liệu": {
    "policy": "enforce_physically_accurate_color_rendering",
    "reference_database": "real_world_material_properties",
    "notes": "AI phải tái tạo màu sắc của từng vật liệu (da, gỗ, vải, kim loại) dựa trên đặc tính vật lý và cách chúng phản xạ/hấp thụ ánh sáng trong đời thực. Màu sắc phải 'đúng' với bản chất vật liệu."
  },
  "ràng_buộc_chủ_thể": {
    "keep_identity": true,
    "lock_features": ["khuôn mặt", "biểu cảm"],
    "kiểm_soát_tuổi_tác": {
      "policy": "preserve_apparent_age_from_original",
      "avoid_actions": ["làm sâu thêm nếp nhăn"]
    },
    "khóa_tư_thế_và_dáng_đứng": { "policy": "strict_adherence_to_original_pose" },
    "bảo_tồn_đặc_tính_chủng_tộc": {
      "policy": "strict_adherence_to_phenotype", "target_ethnicity": "Người Châu Á (Asian)"
    },
    "kiểm_tra_giải_phẫu_học": {
      "policy": "enforce_human_anatomy_realism",
      "rules": {
        "hand_structure": "luôn có 5 ngón, không bị biến dạng",
        "foot_structure": "phải có giải phẫu bàn chân người chính xác, không bị biến dạng",
        "body_parts": "tất cả các bộ phận cơ thể được tái tạo phải tuân thủ đúng giải phẫu và tỷ lệ của con người"
      }
    }
  },
  "chỉnh sửa": {
    "da": {
      "hoàn thiện": "Khôi phục làn da khỏe mạnh ở đúng độ tuổi. Giữ lại lỗ chân lông và các đường nét tự nhiên.",
      "technique": "advanced_frequency_separation_with_micro_texture_preservation",
      "undertone_correction": { "policy": "preserve_or_restore_asian_undertones", "target": ["yellow", "olive"], "avoid": ["pink", "reddish_caucasian"] }
    },
    "râu_và_lông_mặt": { "policy": "preserve_and_enhance_individual_strand_texture", "avoid_smoothing": true },
    "tóc": { "hoàn thiện": "Tách sợi rõ ràng, có độ bóng khỏe và đổ khối chân thực.", "detail_enhancement": "cực cao" },
    "quần áo_và_vật_thể": {
      "policy": "hyperrealistic_material_and_texture_rendering",
      "material_identification": true,
      "physically_based_rendering": true,
      "detail_level": "cực cao"
    },
    "cảnh_vật_đồ_vật_bầu_trời": {
      "policy": "enhance_all_elements_with_micro_details",
      "detail_level": "cực cao",
      "sky_enhancement": "realistic_and_dynamic"
    }
  },
  "ánh sáng_và_màu_sắc": {
    "khử_ám_màu": { "policy": "auto_neutralize_color_casts", "strength": "cực cao" },
    "ánh sáng": {
      "thiết lập": "ánh sáng tự nhiên, cân bằng, rõ ràng, tối ưu hóa bởi nhận thức 3D.",
      "white_balance": "trung tính chính xác (5500K)",
      "dynamic_range_recovery": "cực cao"
    },
    "chỉnh_màu": {
      "đường_cong_tone": "đường cong tương phản kỹ thuật số tối ưu", "vibrance": "tăng đáng kể", "saturation": "tăng nhẹ"
    }
  },
  "lý lịch": {
    "preserve_original": true,
    "nâng cao": "làm sạch, phục hồi, và tăng cường đáng kể độ trong, tương phản, và chi tiết vi mô của nền. Loại bỏ các khuyết điểm nhỏ hoặc các yếu tố gây xao lãng nếu nó cải thiện bố cục tổng thể, nhưng phải duy trì cảnh và cấu trúc gốc.",
    "noise_reduction": { "method": "AI_deep_learning_and_detail_preserving", "strength": "cao" }
  },
  "hậu_kỳ": {
    "sharpening": {
      "policy": "adaptive_frequency_selective_sharpening_extreme_detail",
      "amount": 0.5, "radius": 1.5, "threshold": 3
    },
    "Clarity": "cao", "Dehaze": "trung bình", "micro_contrast": "cực cao"
  },
  "đầu ra": {
    "độ phân giải": "9256x6944", "dpi": 300, "định dạng": "TIFF", "độ_sâu_màu": "16-bit", "không gian_màu": "Adobe RGB"
  },
  "negative_prompt": [
    "da nhựa", "da sáp", "quá mịn", "airbrushed", "mất kết cấu da", "hiệu ứng tranh vẽ", "nhân vật game",
    "già hơn tuổi thật", "da nhăn nheo", "thay đổi tư thế", "đặc điểm Tây hóa", "6 ngón tay", "tay/chân bị biến dạng", "tỷ lệ cơ thể sai",
    "màu sắc không chân thực (unrealistic colors)",
    "màu vật liệu sai (incorrect material color)",
    "màu gỗ nhân tạo (artificial wood color)",
    "màu da sai lệch (inaccurate skin tones)",
    "quá bão hòa", "ánh sáng phẳng", "tóc bệt",
    "màu sắc nhợt nhạt, bạc màu", "ảnh bị nhiễu, có hạt", "mờ, không sắc nét", "phẳng, thiếu chiều sâu, không nổi khối"
  ]
}`,
  oneClickRestoreModern: 'Phục chế Hiện đại',
  oneClickRestoreModernPrompt: `{
  "phiên bản": "6.6-PRO-HDR-RECONSTRUCT",
  "nhiệm vụ": "Nhiệm vụ Tối thượng: Tái tạo và Nâng cấp Ảnh Rách/Cũ. Mục tiêu là biến một bức ảnh cũ, hỏng nặng, mờ, nhiễu thành một bức ảnh hiện đại, siêu thực với màu sắc HDR sống động và độ trong trẻo cao. Phải TÁI TẠO lại hoàn toàn các vùng bị hỏng (cả chủ thể và nền) một cách liền mạch, khôi phục chi tiết vi mô bị mất, và tạo độ sâu 3D nổi khối cho ảnh.",
  "notes": "Phiên bản này tập trung vào 'Tái tạo Toàn diện'. AI không chỉ vá lại phần rách mà phải: 1. **Tô Màu Lại Hoàn Toàn**: Nếu ảnh gốc là đen trắng hoặc ám màu, phải TÔ MÀU LẠI từ đầu, tạo ra màu sắc sống động, chân thực. 2. **Tái tạo Màu sắc HDR Sống động**: Màu sắc phải rực rỡ và chính xác như ngoài đời thực. 3. **Tái tạo Chi tiết Hỏng Nặng**: Đây là ưu tiên hàng đầu. Phải xác định và tái tạo lại hoàn toàn các vùng bị trầy xước, rách, loang lổ, phai màu. 4. **Tạo Độ sâu 3D**: Sử dụng ánh sáng và đổ bóng tinh vi để tạo cảm giác 'nổi khối'.",
  "xử_lý_khung_ảnh": {
    "policy": "ưu_tiên_nội_dung_chính",
    "description": "BƯỚC 0 - XÁC ĐỊNH NỘI DUNG CHÍNH (QUAN TRỌNG NHẤT): Trước khi phục chế, hãy phân tích và xác định vùng chứa nội dung nhiếp ảnh thực sự của bức ảnh. Bỏ qua và loại bỏ hoàn toàn các phần rìa bị hỏng, mép giấy rách, hoặc các phần khung ảnh không liên quan. Nhiệm vụ là phục chế 'bức ảnh', không phải 'mẩu giấy bị hỏng'. Cắt bỏ các phần thừa này một cách thông minh để tạo ra một khung ảnh hình chữ nhật, sạch sẽ chỉ chứa cảnh gốc. Toàn bộ quá trình phục chế sau đó sẽ được áp dụng trên vùng ảnh đã được cắt này."
  },
  "mô_phỏng_máy_ảnh": {
    "brand_model": "Sony A7R V",
    "ống kính": "FE 50mm f/1.2 GM",
    "look": "Siêu sắc nét, màu sắc HDR sống động và trong trẻo, chi tiết vi mô cực cao, không gắt.",
    "settings": { "aperture": "f/1.8", "iso": 100, "bokeh_quality": "creamy_and_smooth" }
  },
  "kiểm_soát_màu_sắc_vật_liệu": {
    "policy": "enforce_physically_accurate_color_rendering",
    "reference_database": "real_world_material_properties",
    "notes": "AI phải tái tạo màu sắc của từng vật liệu (da, gỗ, vải, kim loại) dựa trên đặc tính vật lý và cách chúng phản xạ/hấp thụ ánh sáng trong đời thực. Màu sắc phải 'đúng' với bản chất vật liệu."
  },
  "ràng_buộc_chủ_thể": {
    "keep_identity": true,
    "lock_features": ["khuôn mặt", "biểu cảm"],
    "kiểm_soát_tuổi_tác": {
      "policy": "preserve_apparent_age_from_original",
      "avoid_actions": ["làm sâu thêm nếp nhăn"]
    },
    "khóa_tư_thế_và_dáng_đứng": { "policy": "strict_adherence_to_original_pose" },
    "bảo_tồn_đặc_tính_chủng_tộc": {
      "policy": "strict_adherence_to_phenotype", "target_ethnicity": "Người Châu Á (Asian)"
    },
    "kiểm_tra_giải_phẫu_học": {
      "policy": "enforce_human_anatomy_realism",
      "rules": {
        "hand_structure": "luôn có 5 ngón, không bị biến dạng",
        "foot_structure": "phải có giải phẫu bàn chân người chính xác, không bị biến dạng",
        "body_parts": "tất cả các bộ phận cơ thể được tái tạo phải tuân thủ đúng giải phẫu và tỷ lệ của con người"
      }
    }
  },
  "chỉnh sửa": {
    "phục_hồi_chi_tiết_hư_hỏng": {
      "policy": "forensic_level_damage_reconstruction",
      "strength": "cực cao",
      "targets": ["scratches", "tears", "creases", "stains", "discoloration_spots", "water_damage", "mold_spots", "tape_marks", "faded_areas"],
      "method": "Phân tích loại hư hỏng và áp dụng tái tạo chuyên biệt. Đối với các vùng bị mất, thực hiện inpainting nhận thức bối cảnh sử dụng các kết cấu và cấu trúc xung quanh để tái tạo lại thông tin bị mất một cách liền mạch."
    },
    "da": {
      "hoàn thiện": "Khôi phục làn da khỏe mạnh ở đúng độ tuổi. Giữ lại lỗ chân lông và các đường nét tự nhiên.",
      "technique": "advanced_frequency_separation_with_micro_texture_preservation",
      "undertone_correction": { "policy": "preserve_or_restore_asian_undertones", "target": ["yellow", "olive"], "avoid": ["pink", "reddish_caucasian"] }
    },
    "râu_và_lông_mặt": { "policy": "preserve_and_enhance_individual_strand_texture", "avoid_smoothing": true },
    "tóc": { "hoàn thiện": "Tách sợi rõ ràng, có độ bóng khỏe và đổ khối chân thực.", "detail_enhancement": "cực cao" },
    "quần áo_và_vật_thể": {
      "policy": "hyperrealistic_material_and_texture_rendering",
      "material_identification": true,
      "physically_based_rendering": true,
      "detail_level": "cực cao"
    },
    "cảnh_vật_đồ_vật_bầu_trời": {
      "policy": "enhance_all_elements_with_micro_details",
      "color_restoration": "BẮT BUỘC: Nếu ảnh gốc là đen trắng, ám vàng, hoặc có màu đơn sắc, phải loại bỏ hoàn toàn và tô màu lại bằng màu sắc sống động, tự nhiên như thật. Không được giữ lại bất kỳ tông màu cũ nào. Màu sắc phải chân thực như được chụp bằng máy ảnh hiện đại.",
      "detail_level": "cực cao",
      "sky_enhancement": "realistic_and_dynamic"
    }
  },
  "ánh sáng_và_màu_sắc": {
    "khử_ám_màu": { "policy": "auto_neutralize_color_casts", "strength": "cực cao" },
    "ánh sáng": {
      "thiết lập": "ánh sáng tự nhiên, cân bằng, rõ ràng, tối ưu hóa bởi nhận thức 3D.",
      "white_balance": "trung tính chính xác (5500K)",
      "dynamic_range_recovery": "cực cao"
    },
    "chỉnh_màu": {
      "đường_cong_tone": "đường cong tương phản kỹ thuật số tối ưu", "vibrance": "tăng đáng kể", "saturation": "tăng nhẹ"
    }
  },
  "lý lịch": {
    "policy": "full_reconstruction_and_enhancement",
    "description": "Nền quan trọng như chủ thể. Nó phải được phục hồi hoàn toàn. Điều này bao gồm việc loại bỏ tất cả các hư hỏng (vết bẩn, trầy xước) và tái tạo lại một cách thông minh bất kỳ khu vực nào bị mất hoặc hư hỏng nặng. Nền cuối cùng phải sạch sẽ, rõ ràng và nhất quán về mặt bối cảnh với chủ thể.",
    "nâng cao": "làm sạch, phục hồi, tăng cường độ trong, tương phản, và chi tiết vi mô.",
    "noise_reduction": { "method": "AI_deep_learning_and_detail_preserving", "strength": "cao" }
  },
  "hậu_kỳ": {
    "sharpening": {
      "policy": "adaptive_frequency_selective_sharpening_extreme_detail",
      "amount": 0.5, "radius": 1.5, "threshold": 3
    },
    "Clarity": "cao", "Dehaze": "trung bình", "micro_contrast": "cực cao"
  },
  "đầu ra": {
    "độ phân giải": "9256x6944", "dpi": 300, "định dạng": "TIFF", "độ_sâu_màu": "16-bit", "không gian_màu": "Adobe RGB"
  },
  "negative_prompt": [
    "da nhựa", "da sáp", "quá mịn", "airbrushed", "mất kết cấu da", "hiệu ứng tranh vẽ", "nhân vật game",
    "già hơn tuổi thật", "da nhăn nheo", "thay đổi tư thế", "đặc điểm Tây hóa", "6 ngón tay", "tay/chân bị biến dạng", "tỷ lệ cơ thể sai",
    "màu sắc không chân thực (unrealistic colors)", "quá bão hòa", "ánh sáng phẳng", "tóc bệt",
    "màu sắc nhợt nhạt, bạc màu", "ảnh bị nhiễu, có hạt", "mờ, không sắc nét", "phẳng, thiếu chiều sâu, không nổi khối", "kết quả trông giống ảnh cũ đã được tô màu",
    "ảnh ám vàng", "ảnh ám nâu đỏ", "giữ lại tông màu đen trắng", "vẫn còn vết xước", "vẫn còn vết loang", "vết bẩn chưa được xóa", "nền bị hỏng",
    "giữ lại rìa ảnh rách", "giữ lại mép giấy"
  ]
}`,
  oneClickFixLighting: 'Sửa ánh sáng',
  oneClickBoostColor: 'Tăng màu sắc',
  oneClickBoostColorPrompt: `**AI TASK: Semantic Color Enhancement v4.0**

Your primary goal is to intelligently and realistically enhance the colors in the image by first understanding its content. You must perform a semantic analysis to identify different regions and apply context-specific adjustments. The final result should be vibrant and punchy, but still natural and believable.

**EXECUTION PROTOCOL (Strict Order):**

1.  **Semantic Segmentation:** Analyze the image to identify and segment the following key elements:
    *   **People:** Skin, hair, eyes, lips.
    *   **Nature:** Sky, water (lakes, oceans), foliage (trees, grass, plants), flowers.
    *   **Man-made Objects:** Buildings, vehicles, clothing.
    *   **Foreground/Background:** Differentiate between the main subject and the background.

2.  **Context-Aware Color Correction (Apply these rules selectively based on segmentation):**
    *   **Skin Tones:** Enhance warmth and richness to look healthy and natural. **Crucially, AVOID unnatural orange or red casts.** Preserve the original ethnicity and skin tone, just make it look better-lit and more vibrant.
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
  adjustmentPortraitGentleSmile: 'Nụ cười mỉm',
  adjustmentOpenEyes: 'Mở mắt',
  adjustmentStraightenPosture: 'Làm thẳng tư thế',
  adjustmentWhitenTeeth: 'Làm trắng răng',
  adjustmentRemoveBg: 'Xóa nền',
  adjustmentUpscale8K: 'Nâng cấp 8K',
  adjustmentUpscale8KPrompt: `{
"version": "3.0_8K_upscale_restoration",
"task": "image_restoration_and_upscaling",
"notes": "Mục tiêu chính: Nâng cấp ảnh chất lượng thấp, mờ, nhiễu lên độ phân giải 8K. AI phải phân tích các khiếm khuyết (nhiễu, mờ, vỡ khối), loại bỏ chúng và tái tạo lại các chi tiết bị mất (vân da, sợi tóc, họa tiết vải) một cách siêu thực. Ưu tiên hàng đầu là giữ lại 100% nhận dạng gốc và tạo ra kết quả sắc nét, tự nhiên.",
"processing_controls": {
  "priority": "maximum_detail_enhancement_and_artifact_removal",
  "identity_fidelity_strength": 1.0,
  "detail_generation_realism": 1.0
},
"input_images": [
  "REPLACE_WITH_LOW_QUALITY_IMAGE_ID"
],
"restoration_and_upscaling_pipeline": {
  "step_1_analysis": {
    "description": "Phân tích ảnh gốc để xác định các loại lỗi.",
    "analyze_artifacts": ["jpeg_compression", "blurriness", "gaussian_noise", "color_banding", "low_resolution"]
  },
  "step_2_pre_restoration": {
    "description": "Làm sạch ảnh gốc trước khi nâng cấp để tránh khuếch đại lỗi.",
    "noise_reduction": {
      "model": "advanced_deep_learning_denoiser",
      "strength": "adaptive_to_image_content"
    },
    "compression_artifact_removal": {
      "strength": "high",
      "deblocking_filter": true
    },
    "blur_removal": {
      "model": "deconvolution_or_gan_based_deblur",
      "strength": "adaptive"
    }
  },
  "step_3_detail_synthesis": {
    "description": "Tái tạo thông minh các chi tiết không có trong ảnh gốc.",
    "texture_synthesis_targets": [
      "skin_pores_and_fine_lines",
      "individual_hair_strands_and_eyelashes",
      "fabric_weaves_and_stitching",
      "architectural_textures (brick, wood)",
      "natural_foliage_details (leaves, grass)"
    ],
    "realism_model": "photorealistic_generative_engine"
  },
  "step_4_upscaling": {
    "description": "Phóng to ảnh lên độ phân giải mục tiêu.",
    "upscaling_model": "esrgan_or_diffusion_based_upscaler",
    "target_resolution": "8K (7680x4320)",
    "tile_size": "512",
    "tile_overlap": "64"
  },
  "step_5_post_processing": {
    "description": "Tinh chỉnh cuối cùng sau khi nâng cấp.",
    "final_sharpening": {
      "method": "adaptive_unsharp_mask",
      "strength": "light_to_moderate"
    },
    "color_and_tone_correction": {
      "method": "auto_restore_natural_tones",
      "vibrance_enhancement": "subtle"
    }
  }
},
"subject_restoration": {
  "facial_restoration": {
    "enabled": true,
    "model": "dedicated_face_restoration_model (e.g., GFPGAN, CodeFormer)",
    "fidelity": 1.0,
    "keep_identity": true,
    "facial_identity_locks": [
      "face shape and proportions",
      "facial_asymmetry",
      "moles, scars, freckles",
      "eye shape and color",
      "nose shape",
      "mouth shape"
    ]
  }
},
"output": {
  "resolution": "7680x4320",
  "dpi": 300,
  "format": "PNG",
  "color_space": "sRGB IEC61966-2.1",
  "quality_level": "lossless",
  "bit_depth": 16
},
"negative_prompt": [
  "plastic skin", "waxy look", "oversmoothed", "loss of natural texture",
  "halo effect", "over-sharpened edges", "glowing edges",
  "uncanny valley effect", "distorted background faces", "morphed identity",
  "generated artifacts", "repeated patterns", "unrealistic details",
  "blurry patches", "watercolor effect", "painting-like", "cartoonish"
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
  insertTitle: 'Ghép ảnh',
  insertDescription: 'Kết hợp nhiều người, phong cách và nền để tạo ra một hình ảnh hoàn toàn mới.',
  insertSubject: 'Đối tượng (Người)',
  insertUploadPlaceholder: 'Tải lên',
  insertBackgroundOptional: 'Nền (Tùy chọn)',
  insertClickToChange: 'Nhấp để thay đổi',
  insertStyle: 'Phong cách (Tùy chọn)',
  insertPromptPlaceholder: 'Mô tả cảnh và hành động...',
  insertPromptPlaceholderInitial: 'Mô tả cảnh, đối tượng sẽ làm gì...',
  insertApply: 'Kết hợp',
  insertErrorNoSubjects: 'Vui lòng tải lên ít nhất một ảnh đối tượng.',
  scanTitle: 'Quét tài liệu',
  scanDescription: 'Tự động làm thẳng, cắt và nâng cao chất lượng tài liệu.',
  scanEnhancement: 'Nâng cao',
  scanColor: 'Màu',
  scanGrayscale: 'Thang xám',
  scanBW: 'Đen trắng',
  scanRemoveShadows: 'Xóa bóng',
  scanRestoreText: 'Phục hồi văn bản',
  scanRestoreTextTooltip: 'Tái tạo lại văn bản bị mờ hoặc không rõ ràng. Hữu ích cho các tài liệu chất lượng thấp.',
  scanRemoveHandwriting: 'Xóa chữ viết tay',
  scanAuto: 'Quét tự động',
  scanManual: 'Chỉnh sửa thủ công',
  scanHistoryTitle: 'Lịch sử quét',
  scanHistoryReview: 'Xem lại bản quét',
  scanModalTitle: 'Tài liệu đã quét',
  scanModalClose: 'Đóng',
  scanModalZoomIn: 'Phóng to',
  scanModalZoomOut: 'Thu nhỏ',
  scanModalResetZoom: 'Đặt lại thu phóng',
  scanModalCompare: 'So sánh với bản gốc',
  scanDiscard: 'Hủy bỏ',
  scanAdjustCorners: 'Chỉnh sửa góc',
  scanDownloadPdf: 'Tải PDF',
  scanSave: 'Lưu & Sử dụng',
  scanManualTitle: 'Chỉnh sửa góc',
  scanManualDescription: 'Kéo các góc để khớp với các cạnh của tài liệu.',
  scanApplyManual: 'Áp dụng',
  scanCancel: 'Hủy',
  scanExportToWord: 'Xuất sang Word',
  scanExportToExcel: 'Xuất sang Excel',
  extractTitle: 'Trích xuất',
  extractDescription: 'Mô tả một vật thể trong ảnh để trích xuất nó với nền trong suốt.',
  extractPlaceholder: 'ví dụ: "chiếc mũ đỏ", "người phụ nữ mặc váy xanh"',
  extractApply: 'Trích xuất',
  extractResultTitle: 'Vật thể đã trích xuất',
  extractHistoryTitle: 'Lịch sử trích xuất',
  extractUseAsStyle: 'Dùng làm Phong cách',
  suggestionTitle: 'Đề xuất:',
  suggestionRestoreFace: 'Phục hồi khuôn mặt',
  suggestionFixLighting: 'Sửa ánh sáng',
  suggestionPortraitTools: 'Công cụ chân dung',
  suggestionDismiss: 'Bỏ qua',
  historyOriginal: 'Ảnh gốc',
  historyStep: 'Bước {step}',
  historyCurrent: 'Hiện tại',
  studioTitle: 'Studio',
  studioDescription: 'Tạo ra các buổi chụp ảnh chuyên nghiệp bằng cách mô tả phong cách bạn muốn.',
  studioPromptPlaceholder: 'ví dụ: "chụp ảnh thời trang cổ điển thập niên 90", "ảnh chân dung công sở"',
  studioPromptPlaceholderStyle: 'Lệnh sẽ được tạo từ ảnh phong cách.',
  studioPoseStyle: 'Phong cách tạo dáng',
  studioPoseStyleAutomatic: 'Tự động',
  studioPoseStyleDynamic: 'Năng động',
  studioPoseStyleCandid: 'Tự nhiên',
  studioPoseStyleFormal: 'Trang trọng',
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
  tooltipRetouch: 'Chỉnh sửa & Trích xuất',
  tooltipAdjust: 'Nâng cao & Bộ lọc',
  tooltipIdPhoto: 'Ảnh thẻ',
  tooltipExpand: 'Mở rộng',
  tooltipInsert: 'Ghép ảnh',
  tooltipScan: 'Quét tài liệu',
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
  filterColorMoody: 'Tâm trạng',
  filterColorGolden: 'Giờ vàng',
  filterColorVibrant: 'Sống động',
  filterColorCleanBright: 'Sạch & Sáng',
  filterColorSoftPortrait: 'Chân dung mềm mại',
  filterColorLushGreens: 'Cây xanh tươi tốt',
  filterColorAzureBlues: 'Trời biển xanh biếc',
  filterColorAutumnGlow: 'Thu vàng',
  undo: 'Hoàn tác',
  redo: 'Làm lại',
  reset: 'Đặt lại',
  downloadImage: 'Tải xuống',
  hideTools: 'Ẩn công cụ',
  showTools: 'Hiện công cụ',
  startOver: 'Bắt đầu lại',
  uploadNew: 'Tải ảnh mới',

  adjustmentPortraitSmoothSkinPrompt: "Perform a subtle and professional skin smoothing on the subject. Retain natural skin texture, including pores. Do not make the skin look plastic or artificial. Preserve the person's identity and facial structure completely.",
  adjustmentPortraitGentleSmilePrompt: "Subtly and realistically adjust the person's expression to a gentle, closed-mouth smile. Ensure the change is natural and engages the correct facial muscles, including a slight crinkle around the eyes (Duchenne smile). The person's identity must be perfectly preserved.",
  adjustmentOpenEyesPrompt: "If the subject's eyes are partially or fully closed, realistically open them. The new eyes must perfectly match the subject's original eye color, shape, and identity.",
  adjustmentWhitenTeethPrompt: "Subtly and realistically whiten the teeth of the person in the photo. Avoid an overly bright, unnatural look. The result should be a natural, healthy white. Preserve the person's identity.",
  adjustmentPortraitBlurBgPrompt: "Apply a professional and aesthetically pleasing background blur (bokeh) to the image. The primary subject should remain perfectly sharp, while the background is smoothly and naturally blurred. The transition should be seamless, especially around the edges of the subject (hair, etc.).",
  adjustmentRemoveBgPrompt: 'Perform a precision cutout of the primary subject and remove the background, replacing it with perfect transparency. The edges must be clean and professional.',
  filterColorCinematicPrompt: "Apply a cinematic color grade. Emphasize teal and orange tones, deepen the shadows, and slightly desaturate the colors to create a moody, film-like aesthetic.",
  filterColorVibrantPrompt: "Enhance the vibrancy and saturation of the image to make the colors pop. Boost the blues of the sky and the greens of nature for a lively, punchy look.",
  filterColorGoldenPrompt: "Apply a warm, golden-hour glow to the image. Enhance yellow and orange tones, soften the highlights, and create a dreamy, sun-kissed atmosphere.",
  filterColorMoodyPrompt: "Apply a dark and moody color grade. Desaturate the colors, crush the blacks to increase contrast, and add a subtle cool or green tint to the shadows for a dramatic, atmospheric feel.",
  filterCameraFujiPrompt: "Apply a color grade that emulates the look of a classic Fujifilm camera. Focus on producing rich, deep greens, cinematic blues, and pleasing, natural skin tones, reminiscent of Fujifilm's film simulations.",
  filterCameraKodakPrompt: "Apply a color grade that emulates the warm, vibrant, and slightly saturated look of Kodak film stocks like Portra or Kodachrome. Emphasize rich reds and yellows for a nostalgic, timeless feel.",
  filterCameraLeicaPrompt: "Apply a color grade that emulates the signature Leica look. Focus on creating deep contrast, rich blacks, and natural, true-to-life colors with a subtle, three-dimensional pop.",
  filterCameraCanonPrompt: "Apply a color grade that emulates the look of a Canon DSLR. Produce bright, clean colors with a focus on accurate and flattering skin tones, characteristic of Canon's color science.",
  filterFilmVintagePrompt: 'Apply a vintage film look, with slightly faded colors, soft contrast, and a subtle warm tone.',
  filterFilmBWPrompt: 'Convert the image to a high-contrast, dramatic black and white.',
  filterFilmSepiaPrompt: 'Apply a classic sepia tone for a nostalgic, old-fashioned look.',
  filterFilmPolaroidPrompt: 'Simulate a polaroid photo effect with washed-out colors, a slight vignette, and a characteristic color shift.',
  filterArtisticOilPrompt: 'Transform the image into a textured oil painting with visible brushstrokes.',
  filterArtisticWatercolorPrompt: 'Give the image a soft, blended watercolor effect with translucent colors.',
  filterArtisticSketchPrompt: 'Convert the image into a detailed pencil sketch with cross-hatching and defined lines.',
  filterArtisticPopArtPrompt: 'Apply a vibrant, high-contrast pop art style inspired by Andy Warhol, using bold, flat areas of color.',
  filterDigitalSynthwavePrompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.',
  filterDigitalGlitchPrompt: 'Transform the image with digital glitch effects and chromatic aberration.',
  filterDigitalDuotonePrompt: 'Apply a stylish duotone effect using a bold color combination, like cyan and magenta.',
  filterDigitalPixelPrompt: 'Convert the image into a retro 8-bit pixel art style.',
};

// Fix: Export the translations and the key type to make this file a module.
export const translations = {
  vi,
};

export type TranslationKey = keyof typeof vi;