
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality, Type } from "@google/genai";

// --- ERROR CLASSES ---
export class RateLimitError extends Error {
    constructor(message: string = 'Rate limit exceeded after retries.') {
        super(message);
        this.name = 'RateLimitError';
    }
}
export class APIError extends Error { constructor(message: string = 'An API error occurred.') { super(message); this.name = 'APIError'; } }
export class NetworkError extends APIError { constructor() { super('Could not connect to the API service.'); this.name = 'NetworkError'; } }
export class InvalidInputError extends APIError { constructor(message: string = 'The API received invalid input.') { super(message); this.name = 'InvalidInputError'; } }
export class ContentSafetyError extends APIError { constructor() { super('The request was blocked due to content safety policies.'); this.name = 'ContentSafetyError'; } }
export class ModelExecutionError extends APIError { constructor(message: string = 'The AI model failed to execute.') { super(message); this.name = 'ModelExecutionError'; } }


// --- TYPE DEFINITIONS ---
export type Enhancement = 'color' | 'grayscale' | 'bw';
export type Corners = {
    tl: { x: number; y: number };
    tr: { x: number; y: number };
    bl: { x: number; y: number };
    br: { x: number; y: number };
};
export type BoundingBox = { x: number; y: number; width: number; height: number };

interface IdPhotoOptionsBase {
  backgroundColor: 'white' | 'blue' | 'gray' | 'green';
  size: '3x4' | '4x6' | '2x2' | '3.5x4.5' | '5x5';
}
interface StandardIdPhotoOptions extends IdPhotoOptionsBase {
  type: 'standard';
  gender: 'male' | 'female';
  expression: 'neutral' | 'smile' | 'keep' | 'big-smile';
  outfit: 'suit' | 'blouse' | 'collared-shirt-m' | 'collared-shirt-f' | 'ao-dai' | 'office-wear';
  hairstyle: 'keep' | 'professional-short' | 'professional-tied-back' | 'professional-neat-down' | 'male-neat' | 'male-short' | 'male-medium';
  customPrompt?: string;
}
interface NewbornIdPhotoOptions extends IdPhotoOptionsBase {
    type: 'newborn';
}
export type IdPhotoOptions = StandardIdPhotoOptions | NewbornIdPhotoOptions;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const identityCoreV17_0_VI = `
---

**IDENTITY PRESERVATION CORE v17.0 (ZERO-TOLERANCE FORENSIC PROTOCOL)**

**PRIMARY DIRECTIVE:** You are under a ZERO-TOLERANCE protocol. Your single most important task is the absolute, forensic-level preservation of the original person's identity in every aspect. Any deviation from the original facial structure, micro-features, or expression is a total task failure. This protocol overrides all other creative or aesthetic instructions.

\`\`\`json
{
  "identityPreservationCore": {
    "version": "17.0",
    "description": "Giao thức BẢO TOÀN TUYỆT ĐỐI danh tính, biểu cảm, và cấu trúc khuôn mặt. Mỗi cá nhân được xử lý và bảo toàn độc lập với mức độ chính xác pháp y. Phiên bản này tăng cường tính toàn vẹn của cảnh có nhiều người và các quy tắc bảo toàn đặc điểm vi mô.",
    "primaryDirective": "MỆNH LỆNH TỐI THƯỢNG: BẢO TOÀN DANH TÍNH GỐC. Mọi sai lệch đều là THẤT BẠI. Các quy tắc sau đây là BẮT BUỘC và KHÔNG THỂ THƯƠNG LƯỢNG: 1. **CẤU TRÚC XƯƠNG LÀ BẤT BIẾN**: CẤM TUYỆT ĐỐI thay đổi cấu trúc xương. Ví dụ: cằm V-line PHẢI giữ nguyên là cằm V-line, không được làm đầy đặn hơn. 2. **BIỂU CẢM MIỆNG LÀ CỐ ĐỊNH**: CẤM TUYỆT ĐỐI thay đổi trạng thái miệng. Ví dụ: nụ cười hở răng PHẢI được tái tạo chính xác là nụ cười hở răng, không được biến thành miệng khép. 3. **MÀU MÔI PHẢI TỰ NHIÊN**: Khi phục chế ảnh đen trắng, CẤM TUYỆT ĐỐI tô màu môi quá hồng hoặc trông như trang điểm. Màu môi PHẢI được suy luận một cách tự nhiên từ tông màu da.",
    "multiPersonSceneIntegrity": {
        "policy": "STRICT_SPATIAL_AND_RELATIONAL_PRESERVATION",
        "description": "Trong ảnh có nhiều người, bạn PHẢI bảo toàn không chỉ danh tính cá nhân mà còn cả sự toàn vẹn của toàn bộ cảnh. Điều này bao gồm: (1) **Vị trí tương đối**: Giữ nguyên vị trí và khoảng cách của mọi người so với nhau. (2) **Tỷ lệ tương đối**: Không được thay đổi kích thước của một người so với người khác. (3) **Sự tương tác vật lý**: Bất kỳ sự tiếp xúc vật lý nào (ví dụ: tay trên vai) phải được tái tạo chính xác mà không bị méo mó. (4) **Tính nhất quán về ánh sáng**: Ánh sáng và bóng đổ phải nhất quán trên tất cả các cá nhân trong cảnh.",
        "failureCondition": "Thay đổi vị trí, kích thước, hoặc sự tương tác giữa các cá nhân."
    },
    "poseAndExpressionPreservation": {
      "policy": "STRICT_REPLICATION_FORENSIC",
      "description": "Biểu cảm và tư thế của mỗi người PHẢI giống HỆT với ảnh gốc ở cấp độ pháp y. Điều này bao gồm: (1) **Trạng thái miệng**: Nếu miệng gốc đang cười hở răng, kết quả cũng PHẢI cười hở răng. Nếu miệng đang khép, kết quả cũng PHẢI khép. Đây là một quy tắc không có ngoại lệ. (2) Mắt: Độ mở của mắt và hướng nhìn phải được sao chép chính xác. (3) Cơ mặt: Sự co của các cơ mặt tạo nên biểu cảm phải được tái tạo. CẤM TUYỆT ĐỐI diễn giải lại hoặc thay đổi biểu cảm.",
      "failureCondition": "Bất kỳ sự thay đổi nào về nụ cười (đặc biệt là thay đổi từ hở răng sang khép miệng), ánh mắt, hoặc tư thế."
    },
    "technicalProtocol": {
      "steps": [
        {
          "stepNumber": 1,
          "title": "Phân tích Pháp y Toàn cảnh & Cá nhân",
          "description": "Phân tích pháp y cho từng người riêng biệt, trích xuất craniofacial, microFeatures, expressiveSignature, và poseSignature. Đồng thời phân tích vị trí và sự tương tác của họ trong bối cảnh chung.",
          "output": "Bộ hồ sơ nhận dạng toàn diện cho mỗi ID cá nhân và một bản đồ quan hệ không gian."
        },
        {
          "stepNumber": 2,
          "title": "Bảo toàn Cấu trúc Xương sọ (Craniofacial) - ZERO TOLERANCE",
          "description": "Cấu trúc xương cơ bản của khuôn mặt là bất biến. Phân tích và khóa lại các điểm mốc chính của xương sọ, bao gồm hình dáng xương hàm, độ rộng của cằm (V-line, tròn, vuông), cấu trúc xương gò má, và hình dáng của hốc mắt. CẤM TUYỆT ĐỐI việc thay đổi các đặc điểm cấu trúc này. Ví dụ: một chiếc cằm V-line không được làm cho đầy đặn hơn.",
          "constraints": ["ZERO_TOLERANCE_ON_STRUCTURAL_ALTERATION", "PRESERVE_JAWLINE", "PRESERVE_CHIN_SHAPE_EXACTLY"]
        },
        {
          "stepNumber": 3,
          "title": "Bảo toàn Đặc điểm Vi mô & Kết cấu Da - FORENSIC LEVEL",
          "description": "Bảo toàn tất cả các đặc điểm nhận dạng vi mô. Điều này bao gồm nhưng không giới hạn ở: nốt ruồi, tàn nhang, sẹo, vết rỗ, và các đặc điểm độc nhất khác. Kết cấu da (lỗ chân lông, nếp nhăn tự nhiên) phải được giữ lại hoặc tái tạo một cách trung thực để tránh vẻ ngoài 'nhựa' hoặc 'quá mịn'.",
          "constraints": ["PRESERVE_MICRO_FEATURES", "NO_OVERSMOOTHING", "NATURAL_SKIN_TEXTURE_MANDATORY"]
        },
        {
          "stepNumber": 4,
          "title": "Bảo toàn Tuổi & Màu sắc Tự nhiên",
          "description": "Không trẻ hóa, không lão hóa. Da phải giữ nguyên kết cấu thực tế. **LƯU Ý ĐẶC BIỆT VỀ MÀU SẮC KHI PHỤC CHẾ**: Khi phục chế ảnh đen trắng, màu sắc phải được suy luận một cách tự nhiên. **MÀU SẮC MÔI (LIP COLOR)**: Màu môi PHẢI được suy ra một cách tự nhiên từ tông màu da tổng thể. **CẤM TUYỆT ĐỐI** việc tô màu môi quá hồng hoặc quá đỏ như trang điểm, trừ khi có bằng chứng rõ ràng trong ảnh gốc. Màu môi phải hài hòa và tự nhiên.",
          "constraints": ["AGE_PRESERVATION", "NATURAL_LIP_COLORATION_MANDATORY"]
        },
        {
          "stepNumber": 5,
          "title": "Xác minh Toàn diện Sau Render",
          "description": "So sánh từng cá nhân và bố cục chung trong ảnh kết quả với bản phân tích gốc. Nếu bất kỳ cá nhân nào hoặc mối quan hệ không gian của họ không đạt ngưỡng, hủy kết quả.",
          "constraints": ["SimilarityScore >= 0.999 cho từng cá nhân", "SpatialDeviation < 0.01%"]
        }
      ]
    },
    "failureConditions": [
      "THẤT BẠI: Thay đổi cấu trúc xương mặt (ví dụ: làm cằm đầy đặn hơn trong khi bản gốc là V-line).",
      "THẤT BẠI: Thay đổi biểu cảm (ví dụ: biến nụ cười hở răng thành khép miệng).",
      "THẤT BẠI: Tô màu môi không tự nhiên (quá hồng, quá đỏ) khi phục chế ảnh đen trắng.",
      "THẤT BẠI: Xóa hoặc di chuyển các đặc điểm vi mô như nốt ruồi hoặc sẹo.",
      "THẤT BẠI: Thay đổi vị trí tương đối hoặc kích thước của người trong ảnh nhóm.",
      "Tạo khuôn mặt mới hoặc khác biệt cho bất kỳ cá nhân nào.",
      "Da nhựa, không tự nhiên, mất kết cấu.",
      "Hồi quy về khuôn mặt trung bình/AI."
    ]
  }
}
\`\`\`
---
`;

const physicalInteractionEngineV4_0_VI = `
---
**PHYSICAL INTERACTION & OCCLUSION ENGINE v4.0 (STRICT PROTOCOL)**

**PRIMARY DIRECTIVE:** This protocol overrides all blending or stylistic choices. All objects, especially people, are SOLID, OPAQUE entities that occupy physical space.

1.  **Strict Occlusion Mandate:** One object in front of another MUST completely block the view of the object behind it. **ZERO-TOLERANCE for transparency or "ghosting" effects at object boundaries.** Where two subjects overlap, the foreground subject's edge must be sharp and completely opaque.

2.  **Hard Boundary Segmentation:** Before composition, you MUST perform a high-precision segmentation to define the exact, hard-edge silhouette of each subject. This boundary is non-negotiable and must not be blurred or blended away during integration.

3.  **Physics-Based Contact & Shadowing:**
    *   **Contact Points:** Where one object touches another (e.g., a hand on a table, an arm around a shoulder), you MUST render realistic contact shadows to ground the objects together.
    *   **No Light Bleed:** Light from the background MUST NOT bleed through the edges of foreground subjects. The silhouette must be solid.

4.  **Layer-Based Composition Logic:** Treat the scene as a stack of layers (e.g., Background, Person 1, Person 2, Foreground Object). Each layer is 100% opaque. Render them in order from back to front.

**FAILURE CONDITIONS (IMMEDIATE REJECTION):**
- Any visible transparency or translucency at the edges of a person or object where it overlaps another.
- "Ghosting" or "blending" effect between two distinct subjects or between a subject and the background.
- Lack of contact shadows where objects should be touching.
- Illogical continuation of background textures or light 'through' a foreground subject.
---
`;

const foundationalRestorationAddendum = `**ADDENDUM 0: FOUNDATIONAL IMAGE RESTORATION & ENHANCEMENT (NON-NEGOTIABLE)**
This protocol is the absolute first step and foundation for your entire task. Before any other creative work, you MUST perform a forensic analysis and restoration of the input image.

1.  **Analyze for Defects:** Critically examine the input image for common quality issues: blur (motion, out-of-focus), digital noise, compression artifacts, poor lighting (underexposed, harsh shadows, side-lighting causing a "bony" or "flat" look), haze (causing a "cloudy" or "dull" look), and low resolution.
2.  **Execute High-Fidelity Restoration:**
    *   **De-blur & Sharpen:** Intelligently remove blur and sharpen the image, focusing on reconstructing fine details.
    *   **De-noise:** Eliminate digital noise without destroying skin texture or other fine details.
    *   **Re-light & De-haze:** Correct the lighting to be balanced, soft, and natural to create 3D depth. Remove any atmospheric haze to restore clarity and color depth. This is crucial for fixing dark, flat, or cloudy images.
    *   **Reconstruct Details:** For low-resolution inputs, you must intelligently synthesize missing details. This includes generating realistic skin texture (pores, fine lines), individual hair strands, and fabric weaves.
3.  **Naturalism Mandate:** The goal is a super-realistic, high-quality photograph. AVOID any "AI look," "airbrushed skin," or "plastic" textures.
4.  **Preserve Identity:** All restoration work must strictly adhere to the Identity Preservation protocols. The output must be the same person, just in high fidelity.

This restored, high-quality version of the image is the new baseline you will use for the editing task.
`;

// --- UTILITY FUNCTIONS ---
export const dataURLtoFile = (dataUrl: string, filename: string): File => {
    if (!dataUrl) {
        // Return a dummy file to prevent crashes downstream.
        console.error("dataURLtoFile received a null or undefined dataUrl.");
        return new File([], filename);
    }
    const arr = dataUrl.split(',');
    if (arr.length < 2 || !arr[0] || !arr[1]) {
        console.error("Invalid data URL format", dataUrl.substring(0, 30));
        return new File([], filename);
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Could not parse MIME type from data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const fileToGenerativePart = async (file: File) => {
    if (!file) {
        throw new Error("fileToGenerativePart received a null or undefined file.");
    }
    const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          if (typeof reader.result === 'string') {
              resolve(reader.result.split(',')[1]);
          } else {
              reject(new Error("Failed to read file as data URL."));
          }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
    return {
      inlineData: {
        data: await base64EncodedDataPromise,
        mimeType: file.type,
      },
    };
};

async function withErrorHandling<T>(apiCall: () => Promise<T>): Promise<T> {
    try {
        return await apiCall();
    } catch (err: unknown) {
        console.error("Gemini Service Error:", err);
        if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
            throw new NetworkError();
        }
        if (err instanceof Error) {
            const message = err.message.toLowerCase();
            if (message.includes('api key') || message.includes('permission denied')) {
                 throw new InvalidInputError("Invalid API Key or permissions.");
            }
            if (message.includes('400') || message.includes('invalid argument') || message.includes('malformed') || message.includes('unsupported image format')) {
                throw new InvalidInputError("The request was malformed or contained unsupported content.");
            }
            if (message.includes('[safety]') || message.includes('blocked') && message.includes('safety')) {
                throw new ContentSafetyError();
            }
            if (message.includes('500') || message.includes('internal error') || message.includes('service unavailable')) {
                throw new ModelExecutionError("The AI service is currently unavailable.");
            }
            if (message.includes('rate limit') || message.includes('429') || message.includes('resource_exhausted')) {
                throw new RateLimitError();
            }
        }
        // Fallback for other errors from the SDK or network
        throw new APIError(err instanceof Error ? err.message : 'An unknown API error occurred.');
    }
}

// --- IMPLEMENTED API FUNCTIONS ---

async function getImageUrlFromResponse(response: GenerateContentResponse): Promise<string> {
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
    }
    throw new ModelExecutionError("No image found in the response from the AI model.");
}

export const generateRefinedPrompt = async (imageFile: File, userPrompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const masterPrompt = `**AI TASK: Prompt Engineer for Photo Editing v2.0**

**OBJECTIVE:** You are an AI assistant that refines a user's simple request into a detailed, technical prompt for an advanced photo editing AI. Your task is to analyze the user's request and the provided image to generate a new, unambiguous prompt that will produce a high-quality, accurate result.

**EXECUTION PROTOCOL:**

1.  **Analyze Image:** Carefully examine the image to understand its content, main subject(s), background, lighting conditions, and overall style.
2.  **Analyze User Request:** Understand the user's core intent. What do they want to change, add, or remove?
3.  **Synthesize & Refine:** Combine your analysis of the image and the user's request to create a new, detailed prompt.
    *   **Be Specific:** Identify the exact object or area. Instead of "the car," say "the red sports car in the foreground."
    *   **Use Technical Language:** Translate simple terms into editing actions. "Make it look better" could become "Improve the overall lighting, balance the colors, and increase sharpness."
    *   **Contextualize:** Ensure the new prompt makes sense within the context of the image. For example, if adding an object, specify how it should interact with the scene's lighting and shadows.
    *   **Example Transformation:**
        *   **User Request:** "làm cho bầu trời đẹp hơn" (make the sky prettier)
        *   **Your Refined Prompt:** "Select the sky region. Replace the overcast, gray sky with a vibrant, clear blue sky with a few wispy, realistic clouds. Ensure the new sky's lighting direction matches the original lighting on the landscape below."

**OUTPUT REQUIREMENT:**
-   You **MUST** output **ONLY** the refined, final prompt as plain text.
-   Do **NOT** include any explanations, greetings, or markdown formatting.

---
**USER REQUEST:** "${userPrompt}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: masterPrompt }, imagePart] },
        });

        return response.text.trim();
    });
};

export function generateEditedImageWithMaskStream(imageFile: File, prompt: string, maskDataUrl?: string): AsyncGenerator<string, void, undefined> {
    async function* generator() {
        try {
            const imagePart = await fileToGenerativePart(imageFile);
            const parts: any[] = [{ text: '' }, imagePart];

            const masterPrompt = `${foundationalRestorationAddendum}
${identityCoreV17_0_VI}
**AI TASK: Universal Photo Editor v5.2 (Context-Aware)**

**PRIMARY OBJECTIVE:** You are a world-class photo editor AI. Your task is to intelligently interpret a user's natural language request and apply professional, photorealistic edits to a provided image. You must seamlessly handle global adjustments, selective edits (with or without a mask), object removal, and subject manipulation.

**EXECUTION PROTOCOL:**

**STEP 1: ANALYZE THE REQUEST & INPUTS**
1.  **Analyze User Prompt:** Carefully read the user's prompt to understand their intent. Is it a global change (e.g., "fix lighting," "vintage filter") or a selective change targeting a specific object/area (e.g., "change the car's color," "remove the person on the left")?
2.  **Check for Mask:** Analyze the provided inputs to see if a mask image is included.
    *   **If a Mask is Provided:** The user has explicitly defined the area of interest. **ALL EDITS MUST BE STRICTLY CONFINED TO THE WHITE AREAS OF THE MASK.** The unmasked (black) area is immutable and provides context. Your edit must blend seamlessly.
    *   **If No Mask is Provided:** You must perform your own semantic segmentation to identify the object or area described in the user's prompt. If the prompt implies a global change, apply it to the entire image. Your edit should be applied only to the inferred target or globally as appropriate.

**STEP 2: DETERMINE EDIT CATEGORY & EXECUTE**

*   **Global Adjustments:** For requests like "Fix the lighting," "Make it warmer," "Apply a cinematic filter," apply the adjustment to the entire image.
*   **Selective Editing:** For requests like "Change the shirt color to red," "Add a hat," identify the target area (using the mask if provided, or by inference if not) and perform the manipulation. Seamlessly blend the edited area.
*   **Object Removal & Inpainting Protocol v3.0:** For requests like "Remove the person," identify the target object (defined by mask or prompt), remove it, and execute a high-fidelity inpainting process to reconstruct the background. This is a technical task requiring precision.
    *   **Perspective & Geometry Analysis:** Analyze the surrounding area to understand the scene's geometry and perspective lines (e.g., floor lines, wall corners, furniture edges). The reconstructed area **MUST** adhere strictly to these lines.
    *   **Lighting & Shadow Consistency:** Analyze the direction, color, and softness of the light sources in the scene. The inpainted area **MUST** be lit identically to its surroundings. Reconstruct any shadows that would naturally be cast into this area by other objects.
    *   **Texture & Pattern Continuity:** Seamlessly continue any existing textures or patterns (e.g., wood grain, fabric weave, wall texture) into the filled area. Avoid blurry or smudged patches.
    *   **Noise/Grain Matching:** The reconstructed area **MUST** have the same noise and grain structure as the original photo to be indistinguishable.
    *   **Contextual Realism:** The filled area should be plausible. If removing a person from a crowd, fill the space with plausible background people or elements, not just a blur.
*   **Subject Manipulation:** For requests on people like "Make him smile," "Change hair color," perform the manipulation while adhering to a strict **Identity Preservation Protocol**. The person must remain 100% identifiable, and their age must not be altered.

**FINAL INSTRUCTION:** Execute the user's prompt now, following these rules precisely.

---
**USER PROMPT:** "${prompt}"
`;

            parts[0].text = masterPrompt;

            if (maskDataUrl) {
                const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
                const maskPart = await fileToGenerativePart(maskFile);
                parts.push(maskPart);
            }

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: { parts },
                config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
            });
            
            yield await getImageUrlFromResponse(response);

        } catch (err) {
            await withErrorHandling(async () => { throw err; });
        }
    }
    return generator();
}

export const generateFilteredImage = async (imageFile: File, prompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const finalPrompt = `${foundationalRestorationAddendum}
${identityCoreV17_0_VI}
**AI TASK: Creative Filtering on Restored Image**

**PRIMARY OBJECTIVE:** First, restore the input image to a high-quality state. Then, apply the user-requested creative filter.

**EXECUTION PROTOCOL:**

**STEP 1: FOUNDATIONAL RESTORATION (HIGHEST PRIORITY)**
- Execute the 'FOUNDATIONAL IMAGE RESTORATION & ENHANCEMENT' protocol to create a high-quality, professional-looking photograph. This is the new baseline for your work.

**STEP 2: APPLY USER FILTER**
- After the image has been restored, apply the following user-requested filter precisely to the restored baseline.
---
**USER PROMPT:** "${prompt}"
---`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateAdjustedImage = async (imageFile: File, prompt: string, seed?: number): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        let finalPrompt: string;

        // For advanced JSON prompts, prepend the Identity Core.
        try {
            JSON.parse(prompt); // Check if it's a valid JSON string
            if (prompt.includes('"ràng_buộc_chủ_thể"') || prompt.includes('"subject_restoration"') || prompt.includes('"mandatory_constraints"')) {
                 finalPrompt = identityCoreV17_0_VI + `**AI TASK: Advanced Image Restoration**

**PRIMARY OBJECTIVE:** Execute a high-fidelity image restoration based on the strict technical specifications provided in the following JSON object. The 'identityPreservationCore' is your foundational set of rules, and the JSON below provides the specific parameters for this task. Adherence to both is mandatory.

**TECHNICAL SPECIFICATIONS:**
\`\`\`json
${prompt}
\`\`\`
`;
            } else {
                throw new Error("Not a known advanced JSON prompt.");
            }
        } catch (e) {
            // For simple text prompts, also prepend the Identity Core.
            finalPrompt = `${foundationalRestorationAddendum}
${identityCoreV17_0_VI}
**AI TASK: Image Adjustment on Restored Image**

**PRIMARY OBJECTIVE:** First, restore the input image to a high-quality state. Then, apply the user-requested adjustment.

**EXECUTION PROTOCOL:**

**STEP 1: FOUNDATIONAL RESTORATION (HIGHEST PRIORITY)**
- Execute the 'FOUNDATIONAL IMAGE RESTORATION & ENHANCEMENT' protocol to create a high-quality, professional-looking photograph. This is the new baseline for your work.

**STEP 2: APPLY USER ADJUSTMENT**
- After the image has been restored, apply the following user-requested adjustment precisely to the restored baseline.
---
**USER PROMPT:** "${prompt}"
---`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { 
                responseModalities: [Modality.IMAGE, Modality.TEXT],
                ...(seed && { seed })
            },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateExpandedImage = async (imageDataUrl: string, prompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imageFile = dataURLtoFile(imageDataUrl, 'expand-base.png');
        const imagePart = await fileToGenerativePart(imageFile);
        const finalPrompt = `**AI TASK: Photorealistic Image Restoration & Expansion (Outpainting) v3.0**

**PRIMARY OBJECTIVE:** First, restore the original image content to a high-quality, professional level using the 'FOUNDATIONAL IMAGE RESTORATION & ENHANCEMENT' protocol. Then, seamlessly expand the image canvas, filling the new areas with content that is contextually and stylistically consistent with the restored original.

**EXECUTION PROTOCOL:**

**STEP 1: FOUNDATIONAL RESTORATION (HIGHEST PRIORITY)**
- Execute the 'FOUNDATIONAL IMAGE RESTORATION & ENHANCEMENT' protocol on the original image content provided. This restored version is your new baseline.

**STEP 2: CONTEXTUAL ANALYSIS FOR EXPANSION**
- Analyze the restored original image content, including subjects, environment, lighting (direction, color, quality), and overall style.
- Analyze the user's text prompt for additional context or specific instructions for the expanded areas.

**STEP 3: SEAMLESS EXPANSION (OUTPAINTING)**
- Generate new image content in the padded (empty) areas of the canvas.
- **Continuity:** The new content MUST be a logical and photorealistic continuation of the restored original. This includes extending lines, textures, and patterns seamlessly.
- **Lighting Consistency:** The lighting in the new areas MUST perfectly match the direction, color, and quality of the lighting in the restored original. Shadows cast from the original content into the new areas must be accurate.
- **Style Matching:** The style, color grade, and atmosphere of the new content MUST perfectly match the restored original.
- **User Prompt Adherence:** If the user provided a prompt, incorporate those elements naturally into the expanded scene. If the prompt is empty, use your best judgment to create a logical extension.

**FINAL OUTPUT REQUIREMENTS:** A single, cohesive, high-resolution image where the transition between the restored original content and the newly generated content is completely invisible.

---
**USER PROMPT (for expansion context):** "${prompt}"
---`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: finalPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateCompositeImage = async (
    background: File | null,
    subjects: File[],
    styles: File[],
    prompt: string,
    seed?: number
): Promise<string> => {
    return withErrorHandling(async () => {
        const parts: any[] = [];
        let imageGenerationPrompt: string;

        const restorationAddendum = `**ADDENDUM 0: FOUNDATIONAL SUBJECT RESTORATION (NON-NEGOTIABLE)**
This protocol is the absolute first step for your entire task. Before any creative or compositional work, you MUST perform a forensic analysis and restoration of the input 'SUBJECT IMAGE(S)'.

1.  **Analyze for Defects:** Critically examine the subject image(s) for quality issues: blur, noise, compression artifacts, poor lighting, haze, and low resolution.
2.  **Execute High-Fidelity Restoration:**
    *   **De-blur & Sharpen:** Intelligently sharpen the subject, reconstructing fine details.
    *   **De-noise:** Eliminate digital noise without destroying skin texture.
    *   **Re-light & De-haze:** Correct the lighting on the subject to be balanced and natural.
    *   **Reconstruct Details:** Synthesize realistic skin texture (pores, fine lines), hair strands, and fabric weaves.
3.  **Naturalism Mandate:** The restored subject must look like a real person in a high-quality photograph. AVOID any "AI look," "airbrushed skin," or "plastic" textures.
4.  **Preserve Identity:** All restoration work must strictly adhere to the Identity Preservation protocols.

This restored, high-quality version of the subject is the new baseline you will use for all subsequent steps (posing, dressing, composing, etc.).
`;

        const scriptGenerationPrompt = `**NHIỆM VỤ AI: TẠO KỊCH BẢN CẢNH & ĐẾM SỐ NGƯỜI**

**MỤC TIÊU:**
Nhiệm vụ của bạn là phân tích đầu vào của người dùng (lời nhắc và hình ảnh) và tạo ra một đối tượng JSON chứa hai thứ:
1.  Số lượng chính xác tổng số người riêng biệt có thể nhìn thấy trên TẤT CẢ các hình ảnh được cung cấp.
2.  Một "Kịch bản cảnh" chi tiết để AI khác sử dụng.

**QUY TRÌNH THỰC HIỆN (BẮT BUỘC):**
1.  **Lặp qua từng ảnh:** Bạn đã được cung cấp nhiều tệp 'ẢNH ĐỐI TƯỢNG'. Bạn BẮT BUỘC phải kiểm tra từng tệp hình ảnh một cách riêng lẻ.
2.  **Đếm người trong mỗi ảnh:** Đối với mỗi hình ảnh, hãy đếm số lượng người có mặt.
3.  **Tính tổng số người:** Cộng số lượng đếm được từ tất cả các hình ảnh để có được tổng số người. Đây chính là 'person_count' của bạn.
4.  **Tạo Kịch bản cho TẤT CẢ mọi người:** Viết 'scene_script'. Phần 'DÀN DỰNG & DIỄN XUẤT CỦA NHÂN VẬT' BẮT BUỘC phải có một vai diễn cho mỗi người bạn đã đếm. Ví dụ: nếu bạn đếm được 3 người, phải có 3 mô tả nhân vật.

**YÊU CẦU ĐỊNH DẠNG ĐẦU RA (Tuân thủ nghiêm ngặt schema JSON được cung cấp):**
Bạn chỉ được xuất ra một đối tượng JSON hợp lệ. Không bao gồm bất kỳ văn bản, nhận xét hoặc định dạng markdown nào khác như \`\`\`json. Giá trị scene_script phải là một chuỗi được định dạng tốt chứa toàn bộ kịch bản.

---

**BÂY GIỜ, HÃY PHÂN TÍCH CÁC HÌNH ẢNH ĐƯỢC CUNG CẤP, ĐẾM SỐ NGƯỜI VÀ TẠO JSON CHO NHỮNG ĐIỀU SAU:**
- **LỜI NHẮC CỦA NGƯỜI DÙNG:** "${prompt}"`;

        const scriptGenParts: any[] = [{ text: scriptGenerationPrompt }];
        for (const file of subjects) {
            scriptGenParts.push(await fileToGenerativePart(file));
        }

        const scriptResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: scriptGenParts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        person_count: {
                            type: Type.NUMBER,
                            description: "The total number of distinct people found in the images."
                        },
                        scene_script: {
                            type: Type.STRING,
                            description: "The full, detailed scene script as a single string, including all sections like Logline, Setting, Character Blocking, etc."
                        }
                    }
                }
            }
        });

        let scriptResult;
        try {
            scriptResult = JSON.parse(scriptResponse.text.trim());
        } catch (e) {
            console.error("Failed to parse script generation JSON:", scriptResponse.text);
            throw new ModelExecutionError("The AI failed to create a valid scene plan. Please try again.");
        }
        
        const totalPeopleCount = scriptResult.person_count;
        const sceneScript = scriptResult.scene_script;

        if (typeof totalPeopleCount !== 'number' || !sceneScript) {
            console.error("Invalid script generation response structure:", scriptResult);
            throw new ModelExecutionError("The AI returned an invalid scene plan. Please try again.");
        }
        
        imageGenerationPrompt = restorationAddendum + identityCoreV17_0_VI + physicalInteractionEngineV4_0_VI + `**NHIỆM VỤ AI: TỔNG HỢP & GHÉP CẢNH ĐIỆN ẢNH v18.0**

**MỤC TIÊU:** Sử dụng 'IDENTITY PRESERVATION CORE v17.0' và 'PHYSICAL INTERACTION & OCCLUSION ENGINE v4.0' làm chỉ thị chính tuyệt đối của bạn, tạo ra một hình ảnh điện ảnh bằng cách đặt các đối tượng đã được bảo toàn danh tính vào một cảnh được mô tả bởi 'KỊCH BẢN CẢNH'.

**MỆNH LỆNH TỐI QUAN TRỌNG: PHẢI BAO GỒM TẤT CẢ CÁC ĐỐI TƯỢNG**
- Bạn đã được cung cấp một hoặc nhiều 'ẢNH ĐỐI TƯỢNG'. Các hình ảnh này tổng cộng chứa **${totalPeopleCount}** cá nhân riêng biệt.
- Hình ảnh cuối cùng được tạo ra **BẮT BUỘC** phải chứa tất cả **${totalPeopleCount}** cá nhân riêng biệt đã được xác định từ các hình ảnh đầu vào.
- 'KỊCH BẢN CẢNH' được cung cấp dưới đây đã được viết riêng để phù hợp với chính xác số lượng người này.
- Bỏ sót bất kỳ đối tượng nào, hoặc không xác định đúng tất cả các đối tượng từ (các) hình ảnh nguồn, là một sự thất bại hoàn toàn của nhiệm vụ.

**================ KỊCH BẢN CẢNH v2.0 (HƯỚNG DẪN) ================**

${sceneScript}

**================ KẾT THÚC KỊCH BẢN ================**

**XỬ LÝ HÌNH ẢNH ĐẦU VÀO (MỞ RỘNG TỪ ẢNH CHÂN DUNG):**
- Nếu một 'ẢNH ĐỐI TƯỢNG' là một ảnh cắt cúp chặt (chỉ có ảnh chân dung), bạn BẮT BUỘC phải tạo ra một cách chân thực phần thân, tư thế và quần áo của đối tượng theo phần 'DÀN DỰNG & DIỄN XUẤT CỦA NHÂN VẬT' của kịch bản.
- Phần thân được tạo ra phải đúng về mặt giải phẫu và kết nối liền mạch với đầu.

**BỐ CỤC & TÍCH HỢP CẢNH (Tuân thủ Occlusion Engine v4.0):**
- **Tỷ lệ & Kích thước:** Phân tích bối cảnh của kịch bản để xác định tỷ lệ CHÍNH XÁC, THỰC TẾ cho các đối tượng và đạo cụ.
- **Khớp phối cảnh:** Các đối tượng BẮT BUỘC phải được đặt ở một góc máy ảnh và phối cảnh hoàn toàn khớp với cảnh được mô tả.
- **Ánh sáng & Bóng đổ:** Ánh sáng trên các đối tượng (hướng, màu sắc, nhiệt độ, độ mềm) BẮT BUỘC phải khớp hoàn hảo với ánh sáng được mô tả trong kịch bản. Các đối tượng BẮT BUỘC phải đổ bóng thực tế lên môi trường và lên nhau. Tạo bóng tiếp xúc ở những nơi thích hợp.
- **Màu sắc & Không khí:** Chỉnh màu của hình ảnh để khớp với tâm trạng được mô tả trong kịch bản.
- **Tích hợp cạnh:** Đảm bảo các cạnh, đặc biệt là tóc, được phân đoạn hoàn hảo và được hiển thị mờ đục để tránh vẻ ngoài "bị cắt ra" hoặc "bóng ma".

**QUY TRÌNH THỰC HIỆN:**
1.  **Phân tích & Phục hồi Đối tượng:** Xem xét kỹ lưỡng tất cả 'ẢNH ĐỐI TƯỢỢNG' để tìm và xác định tất cả **${totalPeopleCount}** cá nhân riêng biệt. Thực hiện giao thức 'PHỤC HỒI ĐỐI TƯỢNG NỀN TẢNG' trên mỗi người trong số họ.
2.  **Trích xuất Dữ liệu Khuôn mặt:** Thực hiện Trích xuất Dữ liệu Khuôn mặt Pháp y trên các đối tượng đã được phục hồi theo yêu cầu của giao thức CORE.
3.  **Phân tích Kịch bản Cảnh:** Đọc kịch bản như một hướng dẫn về bối cảnh, bối cảnh và tâm trạng.
4.  **Tổng hợp Cảnh:** Xây dựng môi trường và đặt **TẤT CẢ ${totalPeopleCount} đối tượng** vào cảnh theo kịch bản, tuân thủ các quy tắc phân lớp và che khuất nghiêm ngặt.
5.  **Kết xuất với Ánh xạ Cấu trúc 1:1:** Kết xuất tỉ mỉ các đối tượng bằng cách sử dụng dữ liệu khuôn mặt đã trích xuất của họ, đảm bảo độ trung thực 100% dưới ánh sáng của cảnh mới và với biểu cảm mới, tuân thủ nghiêm ngặt các quy tắc của Occlusion Engine.
6.  **Xác minh:** Chạy kiểm tra cuối cùng đối với tất cả các mệnh lệnh CORE và quy tắc Occlusion Engine, đảm bảo tất cả **${totalPeopleCount}** đối tượng đều có mặt và được tính đến.`;
        
        if (background) {
            parts.push({text: "--- BACKGROUND IMAGE ---"});
            parts.push(await fileToGenerativePart(background));
        }
        if (subjects.length > 0) {
            parts.push({text: "--- SUBJECT IMAGE(S) ---"});
            for (const subjectFile of subjects) { parts.push(await fileToGenerativePart(subjectFile)); }
        }
        if (styles.length > 0) {
            parts.push({text: "--- STYLE REFERENCE(S) ---"});
            for (const styleFile of styles) { parts.push(await fileToGenerativePart(styleFile)); }
        }
        parts.unshift({ text: imageGenerationPrompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT], ...(seed && { seed }) },
        });
        return getImageUrlFromResponse(response);
    });
};

export const removePeopleFromImage = async (imageFile: File): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `**AI TASK: Professional Object Removal (People) v2.0**...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateScannedDocument = async (imageFile: File, enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        let prompt = `**AI Task: Document Scan Enhancement v2.0**...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateScannedDocumentWithCorners = async (imageFile: File, corners: Corners, enhancement: Enhancement, removeShadows: boolean, restoreText: boolean, removeHandwriting: boolean): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        let prompt = `**AI Task: Document Scan Enhancement (Manual Crop) v2.0**...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateDocumentStructure = async (imageDataUrl: string): Promise<any> => {
    return withErrorHandling(async () => {
        const imageFile = dataURLtoFile(imageDataUrl, 'doc.png');
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = "Analyze this image of a document. Extract its structure and content, including headings, paragraphs, and tables. Format the output as a JSON object matching the provided schema.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        elements: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    text: { type: Type.STRING },
                                    table: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        try {
            const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
            return JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse JSON from document structure response:", response.text);
            throw new Error("Invalid data structure for the document returned by AI.");
        }
    });
};

export const generateExtractedItem = async (imageFile: File, prompt: string): Promise<string[]> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const fullPrompt = `**AI TASK: Intelligent Object Extraction & Reconstruction v2.2**...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: fullPrompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        const results: string[] = [];
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }
        if (results.length === 0) {
          throw new ModelExecutionError("No item extracted from image.");
        }
        return results;
    });
};

export const generateIdPhoto = async (imageFile: File, options: IdPhotoOptions): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `${foundationalRestorationAddendum}
---
**AI TASK: Professional ID Photo Generation v1.9 (Strict Composition & Lighting)**

**PRIMARY OBJECTIVE (FROM USER):**
Tạo ảnh thẻ tiêu chuẩn quốc tế. Ưu tiên tuyệt đối: Giữ nguyên 100% đặc điểm nhận dạng khuôn mặt. BẮT BUỘC thay thế hoàn toàn ánh sáng gốc bằng ánh sáng studio chuyên nghiệp, phẳng, và không có bóng để đảm bảo khuôn mặt được chiếu sáng đều và rõ nét.
(TRANSLATION: Create an international standard ID photo. Absolute priority: Preserve 100% of facial identity features. MANDATORY to completely replace the original lighting with professional, flat, shadowless studio lighting to ensure the face is evenly and clearly lit.)

---

**EXECUTION PROTOCOL (SEQUENTIAL AND MANDATORY):**

**STEP 1: ESTABLISH STANDARD COMPOSITION (ABSOLUTE FIRST PRIORITY):**
- **Action:** Your FIRST and most critical action is to ensure the image has a standard "head and shoulders" ID photo composition.
- **Analysis:** Analyze the input image frame.
    - **Case A: Input is too tightly cropped (e.g., only the face is visible, shoulders are cut off):** You MUST photorealistically GENERATE the missing shoulders and upper chest to create a proper composition. The generated body must logically and anatomically connect to the head and neck.
    - **Case B: Input is too wide (e.g., shows the full body):** You MUST CROP the image to the standard "head and shoulders" frame. Discard everything below the upper chest.
- **Final Specification:** The final composition MUST only show the person from the top of their shoulders to the top of their head. The bottom edge of the frame must be at or just above the collarbone level.
- **Aspect Ratio:** The final composed image MUST strictly adhere to the aspect ratio specified in the 'Size' parameter.

**STEP 2: PRESERVE IDENTITY (ZERO-TOLERANCE):**
- After establishing composition, ensure the subject's identity within the frame is preserved with 100% fidelity.
- **Facial Identity Locks (DO NOT CHANGE):** face shape and proportions, head shape and proportions, facial asymmetry, skin texture and pores, moles, scars, freckles, dimples, birthmarks, mouth shape, lip thickness, cupid's bow, eye shape, size, color, spacing, tilt, eyelid type (single, double, hooded), nose shape (bridge, tip, nostrils), chin and jawline definition, cheekbone structure, temple depth, forehead size, eyebrow shape and thickness, eyelash length and density, ear shape and position, philtrum shape.
- **No Beautification:** TRUE. Do not "improve" or idealize the face.
- **No Age Alteration:** TRUE.

**STEP 3: RE-LIGHT THE SUBJECT (CRITICAL):**
- **Action:** COMPLETELY REMOVE and REPLACE the original lighting on the subject. The original lighting (whether it is dark, harsh, uneven, or from the side) MUST BE DISCARDED.
- **Specification:** Apply professional, even, soft studio lighting that is standard for official ID photos.
- **Rule:** The lighting must be frontal, flat, and perfectly balanced. It must illuminate the entire face evenly, removing ALL shadows from the face (e.g., under the nose, eyes) and preventing any "bony" or harsh appearances caused by side lighting. The goal is a clear, well-lit, natural-looking portrait.
- **Background Interaction:** The new lighting MUST NOT cast any shadows onto the new, clean background.

**STEP 4: APPLY TECHNICAL SPECIFICATIONS:**
- Only after the image is correctly composed, identity is locked, and the subject is re-lit, apply the following changes based on user specifications.
- **Head Position:** Centered, facing forward, eyes open, mouth closed.
- **Head Size Ratio:** The head should occupy 50-70% of the total image height.
- **Background:** Replace the background with a solid, uniform, perfectly clean color based on user selection.
- **Clothing & Hair:** Adjust clothing and hairstyle as per user specifications, ensuring they are appropriate for an ID photo.
- **Retouching:** ONLY remove non-permanent artifacts (dust, sensor noise). PRESERVE skin texture. BANNED: smoothing, blemish/wrinkle removal.


---
**USER SPECIFICATIONS (Apply during STEP 4):**
- **Photo Type:** ${options.type}
- **Size (for aspect ratio):** ${options.size}
- **Background Color:** ${options.backgroundColor}
${options.type === 'standard' ? `
- **Gender:** ${options.gender}
- **Outfit:** ${options.outfit}
- **Hairstyle:** ${options.hairstyle}
- **Expression:** ${options.expression}
- **Custom Instructions:** ${options.customPrompt || 'None'}
` : ''}
---

**NEGATIVE PROMPT (IMMEDIATE FAILURE CONDITIONS):**
- **INCORRECT COMPOSITION (HIGHEST PRIORITY FAILURE):** Failing to generate shoulders for a tight crop, or failing to crop a wide shot.
- **Showing any part of the body below the collarbone/upper chest.**
- **PRESERVING ORIGINAL LIGHTING.**
- **Harsh shadows on face, shadows on background, uneven lighting, "bony" look from side lighting.**
- Morphed face, changed identity, face swap, generic face.
- Plastic skin, airbrushed, oversmoothed skin.
- Head tilt, smiling, frowning, hair covering face.`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
};

export const generatePhotoshootImage = async (imageFile: File, prompt: string, poseStyle: string, outfitDescription: string, styleFile: File | null, seed: number | null, styleInfluence?: number): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        
        const criticalDirective = styleFile 
            ? `**CRITICAL DIRECTIVE ON INPUTS:**
- Your ONLY visual input for the person is the 'SUBJECT IMAGE'.
- Your inputs for the scene, style, and clothing have been derived from a separate 'Style Reference Image' which you CANNOT see. Your task is to use the TEXT DESCRIPTIONS below ('USER SCENE PROMPT' and 'OUTFIT DESCRIPTION') to build the scene.
- **ABSOLUTE PROHIBITION:** You MUST NOT attempt to find, recall, or use any visual information from the unseen 'Style Reference Image', especially any faces or people. Your generation must be based SOLELY on the 'SUBJECT IMAGE' and the provided text.
- **ABSOLUTE PROHIBITION:** Do not composite, blend, or copy any person or face other than the one from the 'SUBJECT IMAGE'. The final image must feature **only** the person from the 'SUBJECT IMAGE', placed into a scene described by the text prompts.`
            : `**CRITICAL DIRECTIVE ON INPUTS:**
- Your ONLY visual input for the person is the 'SUBJECT IMAGE'.
- Your ONLY inputs for the scene, style, and clothing are the TEXT DESCRIPTIONS provided below ('USER SCENE PROMPT' and 'OUTFIT DESCRIPTION').
- You have NOT been provided with a visual style reference image. You **MUST NOT** hallucinate or invent one.
- **ABSOLUTE PROHIBITION:** Do not composite, blend, or copy any person or face other than the one from the 'SUBJECT IMAGE'. The final image must feature **only** the person from the 'SUBJECT IMAGE'.`;

        const restorationAddendum = `**ADDENDUM 0: FOUNDATIONAL SUBJECT RESTORATION (NON-NEGOTIABLE)**
This protocol is the absolute first step for your entire task. Before any creative or compositional work, you MUST perform a forensic analysis and restoration of the input 'SUBJECT IMAGE'.

1.  **Analyze for Defects:** Critically examine the subject image for quality issues: blur, noise, compression artifacts, poor lighting, haze, and low resolution.
2.  **Execute High-Fidelity Restoration:**
    *   **De-blur & Sharpen:** Intelligently sharpen the subject, reconstructing fine details.
    *   **De-noise:** Eliminate digital noise without destroying skin texture.
    *   **Re-light & De-haze:** Correct the lighting on the subject to be balanced and natural.
    *   **Reconstruct Details:** Synthesize realistic skin texture (pores, fine lines), hair strands, and fabric weaves.
3.  **Naturalism Mandate:** The restored subject must look like a real person in a high-quality photograph. AVOID any "AI look," "airbrushed skin," or "plastic" textures.
4.  **Preserve Identity:** All restoration work must strictly adhere to the Identity Preservation protocols.

This restored, high-quality version of the subject is the new baseline you will use for all subsequent steps (posing, dressing, composing, etc.).
`;

        const fullPrompt = restorationAddendum + identityCoreV17_0_VI + physicalInteractionEngineV4_0_VI + `**AI TASK: Professional Photoshoot Generation v5.0**

**OBJECTIVE:** Using the 'IDENTITY PRESERVATION CORE v17.0' and the 'PHYSICAL INTERACTION & OCCLUSION ENGINE v4.0' as your absolute primary directives, generate a hyper-realistic photoshoot image by placing the preserved subject into a scene described by the user's prompts.

**ADDENDUM: DYNAMIC EXPRESSION & POSE PROTOCOL v2.0 (NON-NEGOTIABLE)**
1.  **DO NOT COPY EXPRESSION (ZERO-TOLERANCE):** You are **STRICTLY FORBIDDEN** from copying or replicating the expression from the original 'SUBJECT IMAGE'. The original expression serves only to establish identity.
2.  **GENERATE NEW EXPRESSION:** You **MUST** generate a new, natural, and contextually appropriate expression for the subject that fits the mood of the 'USER SCENE PROMPT'. This new expression must be applied WITHOUT altering the underlying facial structure defined in the CORE protocol.
3.  **DIVERSITY IN MULTIPLE RESULTS:** This task is often run multiple times with different seeds to generate a set of photos. It is **MANDATORY** that each generated image is unique. You **MUST** introduce subtle variations in both the subject's pose and their facial expression for each generation. Do not produce identical results.

**INPUT IMAGE HANDLING (HEADSHOT EXPANSION):**
- If the 'SUBJECT IMAGE' is a tight crop (headshot only), you MUST realistically generate the subject's body, pose, and clothing according to the 'USER SCENE PROMPT', 'OUTFIT DESCRIPTION', and selected 'Pose Style'.
- The generated body must be anatomically correct and seamlessly connect to the head.

${criticalDirective}

**EXECUTION PROTOCOL:**
1.  **Analyze & Restore Subject:** Perform the 'FOUNDATIONAL SUBJECT RESTORATION' protocol on the person in the 'SUBJECT IMAGE'.
2.  **Extract Facial Data:** Perform Forensic Facial Data Extraction on the restored subject as mandated by the CORE protocol.
3.  **Handle Headshots:** If the subject is a headshot, prepare to generate their body based on the scene, outfit, and pose requirements.
4.  **Analyze Text Prompts:** Synthesize the 'USER SCENE PROMPT' and 'OUTFIT DESCRIPTION' as creative guidelines.
5.  **Construct Scene:** Create a new, original scene and environment based **exclusively** on the text descriptions.
6.  **Apply Pose & Expression:** Generate a new pose and expression for the subject according to the specified '${poseStyle}' and the 'DYNAMIC EXPRESSION & POSE PROTOCOL'.
7.  **Apply Outfit:** Dress the subject in the described outfit: "${outfitDescription}". The clothing must drape realistically and interact with the lighting and environment.
8.  **Render with 1:1 Structural Mapping:** Produce a final image with photorealistic lighting, textures, and details, rendering the subject using their extracted facial data to ensure 100% fidelity under the new scene's lighting and with the new expression, adhering strictly to the Occlusion Engine rules.

**USER SCENE PROMPT (Guideline):**
"${prompt}"

**OUTFIT DESCRIPTION (Guideline):**
"${outfitDescription}"
`;
        
        const parts: any[] = [{ text: fullPrompt }, imagePart];
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT], ...(seed && { seed })},
        });
        return getImageUrlFromResponse(response);
    });
};

export const generateCreativePrompt = async (context: 'studio' | 'insert', imageFiles: (File | null)[], keywords?: string): Promise<string> => {
    return withErrorHandling(async () => {
        const parts: any[] = [];
        const validImageFiles = imageFiles.filter(f => f !== null) as File[];

        if (validImageFiles.length === 0) {
            throw new InvalidInputError("Creative Assistant requires at least one image.");
        }

        let systemInstruction: string;
        
        if (context === 'studio') {
            systemInstruction = `Bạn là một giám đốc sáng tạo chuyên nghiệp cho các buổi chụp ảnh. Người dùng đã cung cấp một hình ảnh của một người và một số từ khóa tùy chọn. Nhiệm vụ của bạn là đóng vai trò trợ lý sáng tạo và tạo ra MỘT lời nhắc chụp ảnh chi tiết, chuyên nghiệp và đầy cảm hứng cho họ.

            **Quy trình:**
            1.  **Phân tích Đối tượng:** Nhìn vào người trong ảnh. Phong thái, tuổi tác, phong cách chung của họ là gì?
            2.  **Phân tích Từ khóa:** Xem xét các từ khóa của người dùng: "${keywords || 'không có từ khóa'}".
            3.  **Lên ý tưởng:** Nghĩ ra một concept chụp ảnh độc đáo và hấp dẫn, phù hợp với đối tượng và từ khóa.
            4.  **Chi tiết hóa:** Viết một đoạn văn mô tả phong phú, chi tiết về concept đó. Bao gồm các chi tiết cụ thể về:
                *   **Concept & Tâm trạng:** Chủ đề tổng thể.
                *   **Bối cảnh/Nền:** Một môi trường chi tiết.
                *   **Ánh sáng:** Mô tả ánh sáng chuyên nghiệp.
                *   **Máy ảnh & Bố cục:** Góc máy, lựa chọn ống kính.
                *   **Chỉnh màu:** Phong cách hậu kỳ.
            
            **Yêu cầu Đầu ra:**
            -   Chỉ xuất ra lời nhắc cuối cùng, chi tiết dưới dạng một khối văn bản thuần túy.
            -   KHÔNG bao gồm bất kỳ văn bản trò chuyện, lời chào, hoặc giải thích nào. Chỉ có lời nhắc.`;
        } else { // 'insert' context
             systemInstruction = `Bạn là Giám đốc Sáng tạo AI chuyên về bố cục ảnh. Người dùng đã cung cấp hình ảnh của một hoặc nhiều người và các từ khóa tùy chọn. Nhiệm vụ của bạn là tạo ra MỘT mô tả cảnh chi tiết, gắn kết và giàu trí tưởng tượng để kết hợp tất cả họ lại với nhau.

            **Quy trình:**
            1.  **Phân tích Đối tượng:** Nhìn vào tất cả những người trong các hình ảnh được cung cấp. Mối quan hệ của họ là gì? Tâm trạng chung của họ là gì?
            2.  **Phân tích Từ khóa:** Xem xét các từ khóa của người dùng: "${keywords || 'không có từ khóa'}".
            3.  **Sáng tạo Kịch bản:** Tạo ra một câu chuyện hoặc một kịch bản hợp lý để kết nối tất cả các đối tượng.
            4.  **Mô tả Cảnh:** Viết một đoạn văn mô tả phong phú, chi tiết. Bao gồm các chi tiết về:
                *   **Bối cảnh:** Một địa điểm cụ thể, thú vị.
                *   **Hành động/Tư thế:** Mỗi người đang làm gì và họ tương tác với nhau như thế nào.
                *   **Tâm trạng & Không khí:** Cảm giác chung của cảnh.
                *   **Ánh sáng:** Mô tả ngắn gọn về ánh sáng.
            
            **Yêu cầu Đầu ra:**
            -   Chỉ xuất ra lời nhắc cuối cùng, chi tiết dưới dạng một khối văn bản thuần túy.
            -   KHÔNG bao gồm bất kỳ văn bản trò chuyện, lời chào, hoặc giải thích nào. Chỉ có lời nhắc.`;
        }
        
        parts.push({ text: systemInstruction });
        for (const file of validImageFiles) {
            parts.push(await fileToGenerativePart(file));
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: parts },
        });

        return response.text.trim();
    });
};

export const generateOutfitDescription = async (imageFile: File, photoshootPrompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `Analyze the clothing of the person in this image...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text;
    });
};

export const inferOutfitFromPrompt = async (photoshootPrompt: string): Promise<string> => {
    return withErrorHandling(async () => {
        const prompt = `**NHIỆM VỤ AI: Suy luận Trang phục từ Bối cảnh v1.0**

        **MỤC TIÊU:** Phân tích mô tả bối cảnh chụp ảnh được cung cấp và tạo ra một mô tả chi tiết, phù hợp và có liên quan đến bối cảnh về trang phục cho đối tượng chính.
        
        **QUY TẮC:**
        1.  **Bối cảnh là Quan trọng nhất:** Trang phục phải hoàn toàn phù hợp với tâm trạng, bối cảnh và phong cách được mô tả trong lời nhắc về cảnh.
        2.  **Cụ thể:** Cung cấp chi tiết về loại quần áo, chất liệu, màu sắc và phong cách tổng thể.
        3.  **Định dạng Đầu ra:** CHỈ trả lời bằng mô tả văn bản của trang phục. Không thêm bất kỳ cụm từ giới thiệu nào như "Đây là mô tả trang phục:".
        
        ---
        **MÔ TẢ BỐI CẢNH CHỤP ẢNH:**
        "${photoshootPrompt}"
        ---
        
        **MÔ TẢ TRANG PHỤC (Đầu ra của bạn):**`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
        });
        return response.text;
    });
};

export const generatePromptFromStyleImage = async (styleFile: File, describeOutfitOnly: boolean): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(styleFile);
        let prompt;
        if (describeOutfitOnly) {
            prompt = `**NHIỆM VỤ AI: Phân tích Trang phục Chi tiết (Không có Người) v2.0**

**MỤC TIÊU QUAN TRỌNG:** Phân tích hình ảnh được cung cấp để tạo ra một mô tả chi tiết, khách quan về quần áo và phụ kiện mà người trong ảnh đang mặc.

**QUY TẮC TUYỆT ĐỐI (KHÔNG THƯƠNG LƯỢNG):** Mô tả của bạn phải tập trung **DUY NHẤT** vào trang phục và phụ kiện. Bạn **BỊ CẤM TUYỆT ĐỐI** mô tả người đang mặc chúng.

**CÁC YẾU TỐ ĐẦU RA BẮT BUỘC (Chỉ tập trung vào những điều này):**

1.  **Trang phục:** Xác định từng món quần áo. Mô tả loại, màu sắc, chất liệu, kết cấu, hoa văn và kiểu dáng (ví dụ: "Một chiếc áo sơ mi linen trắng, rộng rãi," "Quần jean denim tối màu, dáng ôm," "Một chiếc áo khoác da biker màu đen có khóa kéo bạc").
2.  **Phụ kiện:** Xác định bất kỳ phụ kiện nào như trang sức, mũ, khăn quàng, thắt lưng, túi xách hoặc kính. Mô tả chi tiết chúng (ví dụ: "Một sợi dây chuyền vàng mảnh," "Một chiếc mũ rơm rộng vành," "Một chiếc thắt lưng da màu nâu với khóa đồng").
3.  **Giày dép:** Nếu có thể nhìn thấy, hãy mô tả giày (ví dụ: "Giày thể thao da màu trắng," "Giày cao gót da bóng màu đen").
4.  **Phong cách Tổng thể:** Tóm tắt ngắn gọn phong cách của bộ trang phục (ví dụ: "Phong cách đường phố thường ngày," "Trang phục công sở trang trọng," "Phong cách Bohemian và chiết trung").

**KHÔNG ĐỀ CẬP HOẶC MÔ TẢ (KHÔNG KHOAN NHƯỢNG):**
-   Người, người mẫu hoặc đối tượng đang mặc quần áo.
-   Hình dáng cơ thể, tư thế của họ.
-   Khuôn mặt, đặc điểm khuôn mặt, biểu cảm, tuổi tác, giới tính hoặc dân tộc của họ.
-   Bối cảnh hoặc môi trường.

**Đầu ra cuối cùng của bạn phải là một mô tả văn bản ngắn gọn, thực tế CHỈ VỀ TRANG PHỤC, sẵn sàng để sử dụng để mặc cho một người khác trong một hình ảnh mới.**`;
        } else {
            prompt = `**NHIỆM VỤ AI: Phân tích Bối cảnh & Phong cách Chụp ảnh (KHÔNG CÓ NGƯỜI) v2.0**

**MỤC TIÊU QUAN TRỌNG:** Phân tích hình ảnh được cung cấp để tạo một lời nhắc văn bản chi tiết cho bối cảnh và phong cách chụp ảnh.

**QUY TẮC TUYỆT ĐỐI (KHÔNG THƯƠNG LƯỢNG):** Bạn **BỊ CẤM TUYỆT ĐỐI** mô tả bất kỳ người, khuôn mặt, hình người hoặc đối tượng nhân hóa nào có trong ảnh. Phân tích và lời nhắc kết quả của bạn phải tập trung **DUY NHẤT** vào các yếu tố không phải con người.

**CÁC YẾU TỐ ĐẦU RA BẮT BUỘC (Chỉ tập trung vào những điều này):**

1.  **Bối cảnh & Môi trường:** Mô tả nền, bối cảnh, địa điểm và bất kỳ vật thể hoặc đạo cụ nào. Nó ở trong nhà hay ngoài trời? Thời gian trong ngày là gì? (ví dụ: "Một studio tối giản với bức tường bê tông," "Một bãi biển nhiệt đới ngập nắng lúc hoàng hôn với những cây cọ").
2.  **Phong cách Ánh sáng:** Mô tả chi tiết ánh sáng. Đó là ánh sáng cứng hay mềm? Hướng của nguồn sáng chính là gì? Có nhiều đèn không? Nó là tự nhiên hay nhân tạo? (ví dụ: "Ánh sáng một nguồn từ bên cạnh, kịch tính, độ tương phản cao," "Ánh sáng mềm, khuếch tán, đều từ một cửa sổ lớn").
3.  **Bảng màu & Chỉnh màu:** Mô tả bảng màu, tông màu và tâm trạng tổng thể. (ví dụ: "Tông màu giờ vàng ấm áp với màu xanh lá cây giảm bão hòa," "Chỉnh màu điện ảnh mát mẻ với bóng màu xanh mòng két và vùng sáng màu cam").
4.  **Phong cách Nhiếp ảnh & Chi tiết Máy ảnh:** Mô tả kỹ thuật nhiếp ảnh. Góc máy là gì? Có độ sâu trường ảnh nông (nền mờ) không? Loại ống kính nào có thể đã được sử dụng? Có hạt phim (film grain) hay kết cấu cụ thể nào không? (ví dụ: "Chụp từ góc thấp bằng ống kính góc rộng, độ sâu trường ảnh nông, có hạt phim tinh tế").
5.  **Tâm trạng & Cảm xúc Tổng thể:** Tóm tắt không khí của hình ảnh. (ví dụ: "Thanh lịch và tinh tế," "Tự nhiên và năng động," "Bí ẩn và tâm trạng").

**KHÔNG ĐỀ CẬP HOẶC MÔ TẢ (KHÔNG KHOAN NHƯỢNG):**
-   Người, cá nhân, đối tượng, hình người, người mẫu.
-   Khuôn mặt, đặc điểm khuôn mặt, biểu cảm (cười, cau mày, v.v.).
-   Tuổi, giới tính, dân tộc, màu tóc, màu mắt.
-   Tư thế, dáng điệu, ngôn ngữ cơ thể.
-   Quần áo hoặc trang phục (điều này được xử lý bởi một quy trình riêng).

**Đầu ra cuối cùng của bạn phải là một lời nhắc văn bản duy nhất, gắn kết, nắm bắt được bản chất của CHỈ BỐI CẢNH và PHONG CÁCH, sẵn sàng để sử dụng để tạo ra một hình ảnh mới với một người khác.**`;
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: prompt }] },
        });
        return response.text;
    });
};

export const autoCropImage = async (imageFile: File): Promise<string> => {
    return withErrorHandling(async () => {
        const imagePart = await fileToGenerativePart(imageFile);
        const prompt = `**AI TASK: Intelligent Auto-Crop**...`; // Prompt ommitted for brevity
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        return getImageUrlFromResponse(response);
    });
}