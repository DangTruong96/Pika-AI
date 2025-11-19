

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

const vi = {
  appName: 'Pika AI',
  
  // --- Error Messages ---
  errorAnErrorOccurred: 'Đã xảy ra lỗi.',
  errorTryAgain: 'Thử lại',
  errorNoImageLoaded: 'Vui lòng chọn ảnh.',
  errorNoImageLoadedToFilter: 'Cần ảnh gốc.',
  errorNoImageLoadedToAdjust: 'Cần ảnh gốc.',
  errorNoImageLoadedToExpand: 'Cần ảnh gốc.',
  errorFailedToApplyFilter: 'Lỗi bộ lọc.',
  errorFailedToApplyAdjustment: 'Lỗi xử lý.',
  errorFailedToExpandImage: 'Lỗi mở rộng.',
  errorImageStillLoading: 'Đang xử lý...',
  errorCouldNotFindImage: 'Không tìm thấy ảnh.',
  errorCouldNotProcessDownload: 'Lỗi tải xuống.',
  errorImageLoadForDownload: 'Lỗi đọc ảnh.',
  errorDownloadTainted: 'Lỗi bảo mật ảnh.',
  errorEnterDescription: 'Nhập mô tả.',
  errorFailedToGenerate: 'Tạo thất bại.',
  errorAllGenerationsFailed: 'Xử lý thất bại.',
  errorFailedToProcessImage: 'Lỗi xử lý ảnh.',
  errorFailedToExtract: 'Lỗi tách ảnh.',
  errorRateLimit: 'Hệ thống bận.',
  errorNetwork: 'Lỗi mạng.',
  errorInvalidInput: 'Dữ liệu lỗi.',
  errorModelExecution: 'Lỗi dịch vụ AI.',
  errorContentSafety: 'Nội dung không phù hợp.',
  errorAPI: 'Lỗi phản hồi AI.',

  // --- UI Actions ---
  uploadImage: 'Tải Ảnh',
  dragAndDrop: 'Chạm để tải',
  undo: 'Hoàn tác',
  redo: 'Làm lại',
  reset: 'Gốc',
  resetZoom: 'Xem Hết',
  startOver: 'Mới',
  downloadImage: 'Lưu Ảnh',
  showTools: 'Hiện',
  hideTools: 'Ẩn',
  uploadNew: 'Ảnh Mới',
  zoomIn: 'Phóng',
  zoomOut: 'Thu',
  viewOriginal: 'So Sánh',
  viewEdited: 'Kết Quả',
  transformRotateCW: 'Xoay Phải',
  transformRotateCCW: 'Xoay Trái',
  transformFlipH: 'Lật Ngang',
  transformFlipV: 'Lật Dọc',
  historyOriginal: 'Gốc',
  historyStep: 'B.{step}',
  selectResult: 'Chọn',
  resultAlt: 'KQ #{index}',
  new: 'MỚI',
  mainContentAlt: 'Ảnh chính',
  previewAlt: 'Xem trước',
  extractedItemAlt: 'Vật phẩm',
  imageViewerTitle: 'Xem ảnh',
  previousImage: 'Trước',
  nextImage: 'Sau',
  goToImage: 'Ảnh {index}',
  studioSelectResult: 'Dùng',
  expandHistory: 'Lịch sử',
  collapseHistory: 'Thu gọn',
  remove: 'Xóa',
  
  // --- Loading States ---
  loadingTextDefault: 'Đang xử lý...',
  loadingRetouch: 'Đang sửa...',
  loadingFilter: 'Đang lọc màu...',
  loadingAdjustment: 'Đang nâng cấp...',
  loadingIdPhoto: 'Đang tạo ảnh thẻ...',
  loadingExpansion: 'Đang mở rộng...',
  loadingExtract: 'Đang tách...',
  loadingTransform: 'Đang xoay...',
  loadingStyle: 'Đang học phong cách...',
  loadingTranslate: 'Đang dịch...',
  loadingStudioAnalysis: 'Đang phân tích...',
  loadingAnalyzingScene: 'Đang xem cảnh...',
  loadingOutfitStyle: 'Đang xem đồ...',
  loadingInferOutfit: 'Đang đoán đồ...',
  loadingScan: 'Đang quét...',

  // --- Retouch ---
  retouchTitle: 'Chỉnh Sửa',
  retouchDescription: 'Thêm, xóa hoặc sửa chi tiết bằng văn bản.',
  retouchPlaceholder: 'VD: Xóa người, thêm kính, đổi màu áo...',
  generate: 'Thực hiện',
  generateTitle: 'Tạo Ảnh',
  generateDescription: 'Tạo hình ảnh mới từ mô tả.',
  generatePlaceholder: 'Mô tả ảnh muốn tạo...',
  generateAspectRatio: 'Tỷ lệ',
  generateNumImages: 'Số lượng',

  // --- Extract ---
  extractTitle: 'Tách Vật',
  extractDescription: 'Tách lấy đối tượng hoặc trang phục.',
  extractPlaceholder: 'VD: Cái áo, cái túi...',
  extractApply: 'Tách Ngay',
  extractHistoryTitle: 'Đã tách',
  extractClearHistory: 'Xóa hết',
  extractUseAsOutfit: 'Lấy làm đồ',

  // --- Adjust / Enhance ---
  enhanceTitle: 'Nâng Cấp',
  adjustmentPlaceholder: 'Nhập yêu cầu (VD: Làm nét, sáng da)...',
  applyAdjustment: 'Áp Dụng',
  
  // > Categories
  oneClickTitle: 'Một Chạm',
  adjustmentPortraitTitle: 'Chân Dung',
  poseCorrectionTitle: 'Dáng Pose',
  filterTitle: 'Màu Phim',

  // > Presets
  oneClickAIComposition: 'Bố Cục',
  oneClickAutoEnhance: 'Tự Động',
  oneClickLumoFlash: 'Flash Studio',
  oneClickRestoreModern: 'Phục Hồi',
  oneClickAdPoster: 'Poster QC',
  oneClickReconstructForPrint: 'In Ấn',
  oneClickHairRimLight: 'Viền Tóc',
  oneClickBrighteningBathSilver: 'Sáng Bạc',
  oneClickBrighteningBathGold: 'Sáng Vàng',
  oneClickStarFilter: 'Tia Sao',
  oneClickFog: 'Sương Mù',
  oneClickSnow: 'Tuyết Rơi',
  
  // > Specific Adjustments
  adjustmentPortrait50mm: 'Tiêu cự 50mm',
  adjustmentPortrait85mm: 'Tiêu cự 85mm',
  adjustmentNaturalSmile: 'Cười Nhẹ',
  adjustmentSlimFace: 'Thon Mặt',
  adjustmentSlimChinAndNeck: 'Thon Cổ',
  adjustmentOpenEyes: 'Mở Mắt',
  poseNaturalWalk: 'Dáng Đi',
  poseLeaningBack: 'Dáng Tựa',
  poseLookOverShoulder: 'Ngoái Nhìn',
  poseCandidSitting: 'Dáng Ngồi',
  poseHandsInPockets: 'Tay Túi',
  filterColorVibrant: 'Sống Động',
  filterColorGoldenSun: 'Nắng Vàng',
  filterGoldenAutumn: 'Thu Vàng',
  filterColorBlueSunset: 'Hoàng Hôn',
  filterCyberpunk: 'Cyberpunk',
  orSeparator: 'hoặc',
  adjustmentPortraitPreset1: 'Mịn Da',
  adjustmentUpscale8K: 'Upscale 8K',

  // --- ID Photo ---
  idPhotoTitle: 'Ảnh Thẻ',
  idPhotoDescription: 'Tạo ảnh thẻ, hộ chiếu chuẩn quốc tế.',
  idPhotoType: 'Loại',
  idPhotoTypeStandard: 'Tiêu chuẩn',
  idPhotoTypeNewborn: 'Sơ sinh',
  idPhotoGender: 'Giới tính',
  idPhotoGenderMale: 'Nam',
  idPhotoGenderFemale: 'Nữ',
  idPhotoOutfit: 'Trang phục',
  idPhotoOutfitSuit: 'Vest Đen',
  idPhotoOutfitBlouse: 'Sơ Mi Cổ Tròn',
  idPhotoOutfitCollaredShirtM: 'Sơ Mi (Nam)',
  idPhotoOutfitCollaredShirtF: 'Sơ Mi Cổ Đức',
  idPhotoOutfitAoDai: 'Áo Dài',
  idPhotoHairstyle: 'Tóc',
  idPhotoHairKeep: 'Giữ Nguyên',
  idPhotoHairShortNeat: 'Tóc Ngắn',
  idPhotoHairLong: 'Tóc Dài',
  idPhotoHairTiedBack: 'Búi Gọn',
  idPhotoHairNeatDown: 'Xõa Thẳng',
  idPhotoHairMaleNeat: 'Chải Chuốt',
  idPhotoHairMaleShort: 'Cắt Ngắn',
  idPhotoHairMaleMedium: 'Layer/Mái',
  idPhotoExpression: 'Mặt',
  idPhotoExpressionKeep: 'Gốc',
  idPhotoExpressionNeutral: 'Nghiêm',
  idPhotoExpressionSmile: 'Cười Nhẹ',
  idPhotoExpressionBigSmile: 'Cười Tươi',
  idPhotoBackgroundColor: 'Nền',
  idPhotoBgWhite: 'Trắng',
  idPhotoBgBlue: 'Xanh',
  idPhotoBgGray: 'Xám',
  idPhotoBgGreen: 'Lục',
  idPhotoSize: 'Cỡ',
  idPhotoApply: 'Tạo Ảnh',
  idPhotoCustomPromptLabel: 'Thêm',
  idPhotoCustomPromptPlaceholder: 'VD: Chỉnh cổ áo...',
  idPhotoNewbornInfo: 'Chế độ Sơ sinh: Tự động chỉnh tư thế và da.',

  // --- Expand ---
  expandTitle: 'Mở Rộng',
  expandDescription: 'Mở rộng khung hình bằng AI.',
  expandPlaceholder: 'Mô tả phần mở rộng...',
  expandMagic: 'Tự Động',
  expandApply: 'Mở Rộng',
  expandAspectFree: 'Tự do',
  tooltipExpandAuto: 'Tự động điền.',
  tooltipExpandGenerate: 'Mở rộng theo ý.',

  // --- Studio ---
  studioTitle: 'Studio',
  studioDescription: 'Ghép chủ thể vào bối cảnh bất kỳ.',
  studioPromptPlaceholder: 'Mô tả bối cảnh (VD: Paris, studio)...',
  studioPromptPlaceholderStyle: 'Tùy chỉnh kịch bản...',
  suggestionTitle: 'Gợi Ý',
  studioSubjects: 'Mẫu',
  studioSubjectsCount: 'Mẫu ({count}/{max})',
  studioAddSubject: 'Thêm',
  studioStyle: 'Mẫu Style',
  studioObjects: 'Đồ/Đạo cụ',
  generatePhotoshoot: 'Chụp Ảnh',

  // --- Tooltips ---
  tooltipRetouch: 'Chỉnh Sửa',
  tooltipAdjust: 'Nâng Cấp',
  tooltipIdPhoto: 'Ảnh Thẻ',
  tooltipExpand: 'Mở Rộng',
  tooltipStudio: 'Studio',
  tooltipGenerate: 'Tạo Ảnh',

  // --- Prompts (Optimized & Simplified) ---
  
  oneClickAutoEnhancePrompt: `{"phiên_bản":"AUTO_ENHANCE_CLARITY_V3","nhiệm_vụ":"Nâng cấp ảnh lên chuẩn Studio Kỹ thuật số 2025.","yêu_cầu":["1. SẮC NÉT & TRONG TRẺO: Loại bỏ hoàn toàn lớp mờ đục (haze). Ảnh phải trong vắt như pha lê.","2. MÀU SẮC SỐNG ĐỘNG: Tăng độ rực rỡ (vibrance) và độ sâu màu. Da phải hồng hào, khỏe mạnh, không bị ám vàng/xám.","3. CHI TIẾT THỰC: Làm nét từng sợi tóc, thớ vải, nhưng KHÔNG được làm da bị sáp hay nhựa."],"cấm":["Da nhựa","Màu xỉn","Mờ nhòe","Tranh vẽ"]}`,
  
  oneClickAICompositionPrompt: `{"phiên_bản":"COMPOSITION_V2","nhiệm_vụ":"Tái bố cục ảnh nghệ thuật.","quy_trình":["1. CẮT CÚP (CROP): Cắt ảnh để đạt tỷ lệ vàng hoặc quy tắc 1/3, loại bỏ chi tiết thừa ở rìa.","2. LÀM MỜ NỀN (BOKEH): Nếu là chân dung, làm mờ nhẹ nền để nổi bật chủ thể.","3. ÁNH SÁNG DẪN HƯỚNG: Điều chỉnh ánh sáng để mắt người xem tập trung vào chủ thể chính."],"cấm":"Biến dạng chủ thể."}`,
  
  oneClickLumoFlashPrompt: `{"phiên_bản":"LUMO_FLASH_V2","nhiệm_vụ":"Mô phỏng hiệu ứng đèn Flash Studio cao cấp.","quy_trình":["1. ÁNH SÁNG FLASH: Chiếu sáng chủ thể rực rỡ, nổi bật trên nền tối hơn (pop-out).","2. DA SÁNG MỊN: Làm sáng và đều màu da, tạo độ bóng khỏe (glow).","3. TƯƠNG PHẢN: Tăng độ tương phản để tạo chiều sâu."],"cấm":"Cháy sáng (blown-out), da bệt."}`,
  
  oneClickRestoreModernPrompt: `{"phiên_bản": "16.0.0-EXTREME-RECONSTRUCTION-SCENE-INTEGRITY", "Tư_duy_Cốt_lõi": "TÁI CẤU TRÚC VẬT CHẤT TOÀN CẢNH. Tái tạo lại mọi thứ (người, cây cối, đồ vật) bằng vật liệu 8K siêu thực. KHÔNG ĐƯỢC XÓA NỀN.", "MỆNH_LỆNH_GHI_ĐÈ_TỐI_CAO": { "1_BẢO_TỒN_VÀ_TÁI_TẠO_NỀN": "TUYỆT ĐỐI KHÔNG XÓA NỀN hay thay bằng phông nền studio. Nền cũ (cây, nhà, cảnh vật) phải được 'trồng lại' và 'xây lại' sắc nét. Cây phải ra cây (rõ lá), nhà phải ra nhà (rõ gạch).", "2_XỬ_LÝ_KHUNG_VIỀN": "Tự động phát hiện và CẮT BỎ viền ảnh cũ, khung tranh, mép giấy hỏng. Ảnh kết quả chỉ chứa nội dung không gian thực.", "3_NAM_GIỚI_KHÔNG_SON_MÔI": "Kiểm tra giới tính. Nếu là Nam: Môi phải màu da nhạt (nude). TUYỆT ĐỐI KHÔNG ĐỎ/HỒNG. Nếu môi gốc đỏ, hãy làm nó nhạt đi.", "4_VẬT_LIỆU_MỚI": "Quần áo cũ sờn -> Biến thành vải mới tinh, phẳng phiu. Da cũ nhiễu -> Biến thành da thật, căng bóng." }, "QUY_TRÌNH": { "B1": "Cắt bỏ viền ảnh thừa.", "B2": "Phân tích cảnh vật nền và tái tạo chi tiết (lá cây, kết cấu tường).", "B3": "Tái tạo da và quần áo chủ thể bằng vật liệu cao cấp.", "B4": "Cân bằng ánh sáng tự nhiên cho toàn cảnh." }, "negative_prompt": [ "xóa nền", "nền trơn", "background removal", "studio background", "khung ảnh", "viền trắng", "son môi nam", "môi đỏ", "makeup nam", "ảnh cũ", "vết xước", "mờ nhòe" ] }`,
  
  oneClickAdPosterPrompt: `{"phiên_bản":"AD_POSTER_V2","nhiệm_vụ":"Biến ảnh sản phẩm thành Poster quảng cáo điện ảnh.","quy_trình":["1. TÁCH NỀN: Tách sản phẩm khỏi nền cũ.","2. TẠO BỐI CẢNH: Tạo nền mới sang trọng, phù hợp với loại sản phẩm (Mỹ phẩm -> Tinh khiết; Đồ ăn -> Ngon miệng; Công nghệ -> Tương lai).","3. HIỆU ỨNG: Thêm ánh sáng studio, bóng đổ, và các yếu tố trang trí tinh tế (sương khói, tia sáng)."],"cấm":"Biến dạng logo, sai lệch sản phẩm."}`,
  
  oneClickReconstructForPrintPrompt: `{"phiên_bản":"PRINT_RECONSTRUCT_V2","nhiệm_vụ":"Chuyển ảnh chụp tài liệu/tranh thành file thiết kế gốc.","quy_trình":["1. CẮT & LÀM PHẲNG: Cắt bỏ viền thừa, nắn thẳng góc nhìn.","2. KHỬ NHIỄU GIẤY: Loại bỏ vân giấy, nếp nhăn, vết ố.","3. TĂNG ĐỘ NÉT: Làm sắc nét văn bản và đường nét đồ họa.","4. MÀU SẮC: Khôi phục màu sắc gốc, loại bỏ ám màu ánh sáng."],"cấm":"Mờ chữ, méo hình."}`,
  
  oneClickHairRimLightPrompt: `{"phiên_bản":"HAIR_LIGHT_V2","nhiệm_vụ":"Thêm ánh sáng ven tóc (Rim Light).","quy_trình":["1. ĐÈN VEN: Tạo ánh sáng vàng ấm áp từ phía sau, làm sáng viền tóc và vai.","2. ĐÈN CHÍNH: Chiếu sáng khuôn mặt mềm mại, tự nhiên.","3. TÁCH NỀN: Làm tối nền nhẹ để chủ thể nổi bật."],"cấm":"Mặt tối, hào quang giả."}`,
  
  oneClickBrighteningBathSilverPrompt: `Ánh sáng tắm trắng bạc: Mô phỏng nguồn sáng lạnh, mềm mại, khuếch tán rộng. Làm da trắng sáng, trong trẻo, bật tông.`,
  oneClickBrighteningBathGoldPrompt: `Ánh sáng tắm nắng vàng: Mô phỏng ánh nắng giờ vàng ấm áp. Làm da sáng hồng, khỏe mạnh, rạng rỡ.`,
  
  oneClickStarFilterPrompt: `{"phiên_bản":"STAR_FILTER_V2","nhiệm_vụ":"Tạo hiệu ứng tia sao lấp lánh.","quy_trình":["1. PHÁT HIỆN ĐIỂM SÁNG: Tìm các nguồn sáng điểm (đèn, nến, phản quang).","2. TẠO TIA: Vẽ tia sao 4 cánh sắc nét tại các điểm sáng đó.","3. GIỮ NGUYÊN CHỦ THỂ: Không áp dụng lên mặt hay da."],"cấm":"Tia sáng trên mắt, tia sáng trên mặt."}`,
  
  oneClickFogPrompt: `{"phiên_bản":"FOG_V2","nhiệm_vụ":"Thêm sương mù điện ảnh.","quy_trình":["1. LỚP SƯƠNG: Tạo lớp sương mờ ảo, có chiều sâu xa gần.","2. ÁNH SÁNG: Tán xạ ánh sáng qua sương mù (glow).","3. HÒA TRỘN: Làm mềm độ tương phản của chủ thể để hòa vào cảnh."],"cấm":"Che mất mặt chủ thể."}`,
  
  oneClickSnowPrompt: `{"phiên_bản":"SNOW_V2","nhiệm_vụ":"Tạo hiệu ứng tuyết rơi chân thực.","quy_trình":["1. TUYẾT RƠI: Thêm các bông tuyết rơi với kích thước và độ mờ khác nhau (xa/gần).","2. TUYẾT ĐỌNG: Thêm lớp tuyết mỏng trên vai, tóc.","3. KHÔNG KHÍ: Chỉnh màu lạnh (xanh nhạt) để tạo cảm giác giá lạnh."],"cấm":"Tuyết giả tạo, che mắt."}`,
  
  adjustmentUpscale8KPrompt: `{"phiên_bản":"UPSCALE_REALISM_V3","nhiệm_vụ":"Nâng cấp độ phân giải 8K siêu nét nhưng giữ nguyên tính chất ảnh chụp (Photorealistic).","yêu_cầu":["1. CHI TIẾT THẬT: Tăng chi tiết lỗ chân lông, sợi tóc, vân vải một cách chân thực.","2. KHÔNG 'VẼ LẠI': Tuyệt đối KHÔNG biến đổi ảnh thành tranh vẽ kỹ thuật số hay hoạt hình.","3. SẮC NÉT: Loại bỏ hoàn toàn mờ nhòe."],"cấm":["Tranh vẽ (Painting)","Mịn quá mức (Over-smoothed)","Ảo giác chi tiết"]}`,
  
  adjustmentPortrait50mmPrompt: `{"phiên_bản":"LENS_50MM_V2","nhiệm_vụ":"Mô phỏng ống kính chân dung 50mm f/1.8.","quy_trình":["1. XÓA PHÔNG: Làm mờ hậu cảnh mềm mại (bokeh).","2. TIÊU CỰ: Chỉnh sửa phối cảnh tự nhiên, không méo.","3. TĂNG ĐỘ TẬP TRUNG: Làm nổi bật chủ thể."],"cấm":"Mờ chủ thể."}`,
  
  adjustmentPortrait85mmPrompt: `{"phiên_bản":"LENS_85MM_V2","nhiệm_vụ":"Mô phỏng ống kính chân dung 85mm f/1.2.","quy_trình":["1. XÓA PHÔNG MẠNH: Làm mờ hậu cảnh cực mạnh (creamy bokeh).","2. TIÊU CỰ: Nén phối cảnh, làm mặt thon gọn và phẳng hơn (tiêu chuẩn chân dung).","3. TÁCH BIỆT: Chủ thể nổi khối 3D trên nền mờ."],"cấm":"Biến dạng mặt."}`,
  
  adjustmentNaturalSmilePrompt: 'Thay đổi biểu cảm thành nụ cười mỉm tự nhiên, nhẹ nhàng. Giữ nguyên các đặc điểm khác.',
  adjustmentSlimFacePrompt: 'Làm thon gọn khuôn mặt và đường viền hàm một cách tinh tế, tự nhiên.',
  adjustmentSlimChinAndNeckPrompt: 'Làm thon gọn vùng cằm và cổ.',
  adjustmentOpenEyesPrompt: 'Mở to mắt một chút, tạo vẻ lanh lợi.',
  poseNaturalWalkPrompt: 'Chỉnh tư thế thành dáng đi tự nhiên, năng động.',
  poseLeaningBackPrompt: 'Chỉnh tư thế thành dáng tựa lưng thư giãn.',
  poseLookOverShoulderPrompt: 'Chỉnh tư thế ngoái nhìn qua vai quyến rũ.',
  poseCandidSittingPrompt: 'Chỉnh tư thế ngồi tự nhiên.',
  poseHandsInPocketsPrompt: 'Chỉnh tư thế đứng, tay đút túi quần tự tin.',
  
  filterColorVibrantPrompt: 'Tăng độ rực rỡ và bão hòa màu sắc. Làm ảnh sống động, tươi tắn hơn.',
  filterColorGoldenSunPrompt: `{"phiên_bản":"GOLDEN_HOUR_V2","nhiệm_vụ":"Mô phỏng ánh nắng giờ vàng (Golden Hour).","quy_trình":["1. MÀU SẮC: Phủ tông màu vàng cam ấm áp.","2. ÁNH SÁNG: Tạo nguồn sáng từ phía sau hoặc bên cạnh (ngược sáng đẹp).","3. TƯƠNG PHẢN: Tăng tương phản nhẹ."],"cấm":"Da bị ám vàng quá mức."}`,
  filterGoldenAutumnPrompt: `{"phiên_bản":"AUTUMN_V2","nhiệm_vụ":"Biến đổi phong cảnh thành mùa thu.","quy_trình":["1. LÁ CÂY: Chuyển màu lá cây sang vàng tươi/cam.","2. ÁNH SÁNG: Ánh sáng dịu nhẹ, trong trẻo.","3. KHÔNG KHÍ: Lãng mạn, thơ mộng."],"cấm":"Làm vàng da người."}`,
  filterColorBlueSunsetPrompt: `{"phiên_bản":"BLUE_HOUR_V2","nhiệm_vụ":"Mô phỏng giờ xanh (Blue Hour).","quy_trình":["1. MÀU SẮC: Phủ tông màu xanh dương đậm/tím.","2. ÁNH SÁNG: Ánh sáng yếu, mềm mại.","3. ĐÈN: Làm nổi bật các nguồn sáng nhân tạo (vàng/cam) để tương phản."],"cấm":"Mất chi tiết vùng tối."}`,
  filterCyberpunkPrompt: `{"phiên_bản":"CYBERPUNK_V2","nhiệm_vụ":"Phong cách Cyberpunk Neon.","quy_trình":["1. MÀU SẮC: Tông màu chủ đạo là Hồng Neon và Xanh Cyan.","2. ÁNH SÁNG: Tương phản cao, ánh sáng từ biển hiệu neon.","3. KHÔNG KHÍ: Đô thị tương lai, hơi tối."],"cấm":"Mất chi tiết mặt."}`,
};

export type TranslationKey = keyof typeof vi;

export const translations = {
  vi,
};