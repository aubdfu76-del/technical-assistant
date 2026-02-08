import { getPool } from '../config/database';

export interface ChatResponse {
    answer: string;
    citations: Citation[];
    confidence: number;
}

export interface Citation {
    doc_title: string;
    doc_id: string;
    page?: number;
    snippet: string;
    link?: string;
    type?: 'manual' | 'fault' | 'vehicle';
}

export class AIService {

    /**
     * Process a user query and generate a response
     */
    static async processQuery(userId: string, query: string, sessionId: string): Promise<ChatResponse> {
        const pool = getPool();
        const keywords = query.split(' ').filter(w => w.length > 2); // Simple keyword extraction

        if (keywords.length === 0) {
            return {
                answer: "يرجى كتابة تفاصيل أكثر للبحث. على سبيل المثال: 'عطل فرامل شاحنة مرسيدس' أو 'دليل صيانة المحرك'.",
                citations: [],
                confidence: 0
            };
        }

        // 1. Check Technical Manuals (New Priority)
        const manualMatch = await this.findRelatedManuals(keywords);

        // 2. Check Fault History
        const faultMatch = await this.findRelatedFaults(keywords);

        // 3. Check Vehicles
        const vehicleMatch = await this.findRelatedVehicles(keywords);

        // Construct Response
        let answer = "";
        const citations: Citation[] = [];

        if (manualMatch.length > 0) {
            answer += `🔍 **من الكراسات الفنية:**\nعثرت على ${manualMatch.length} كراسة تحتوي على معلومات ذات صلة:\n\n`;
            manualMatch.forEach(m => {
                const snippet = m.content_preview
                    ? m.content_preview.substring(0, 100).trim() + '...'
                    : (m.description ? m.description.substring(0, 100) + '...' : 'ملف فني بصيغة PDF');

                citations.push({
                    doc_title: m.title,
                    doc_id: m.id,
                    snippet,
                    link: `/uploads/manuals/${m.file_path.split(/[\\\/]/).pop()}`,
                    type: 'manual'
                });
            });
        }

        if (faultMatch.length > 0) {
            answer += `🛠️ **من سجلات الأعطال السابقة:**\nيوجد ${faultMatch.length} حالات مشابهة تم التعامل معها سابقاً:\n\n`;
            faultMatch.forEach(f => {
                citations.push({
                    doc_title: `عطل: ${f.title}`,
                    doc_id: f.id,
                    snippet: f.description ? f.description.substring(0, 80) + '...' : '',
                    link: `/diagnosis/common/${f.id}`,
                    type: 'fault'
                });
            });
        }

        if (vehicleMatch.length > 0 && citations.length < 6) {
            vehicleMatch.forEach(v => {
                citations.push({
                    doc_title: `مركبة: ${v.plate_number}`,
                    doc_id: v.id,
                    snippet: `${v.vehicle_type} - ${v.status === 'active' ? 'نشطة' : 'في الصيانة'}`,
                    link: `/vehicles/${v.id}`,
                    type: 'vehicle'
                });
            });
        }

        if (citations.length === 0) {
            answer = "لم أستطع العثور على معلومات دقيقة في السجلات أو الكراسات الفنية. هل يمكنك إعادة صياغة السؤال أو استخدام كلمات مفتاحية مختلفة؟";
        } else if (!answer) {
            answer = "إليك النتائج التي وجدتها متعلقة ببحثك:";
        }

        return {
            answer: answer.trim(),
            citations,
            confidence: citations.length > 0 ? 0.8 : 0.2
        };
    }

    private static async findRelatedManuals(keywords: string[]) {
        const pool = getPool();

        // For Arabic text, search each keyword separately
        const conditions: string[] = [];
        const params: string[] = [];
        let paramIndex = 1;

        keywords.forEach(keyword => {
            if (keyword.length > 2) { // Skip very short keywords
                conditions.push(`(
                    title ILIKE $${paramIndex} OR 
                    description ILIKE $${paramIndex} OR 
                    content ILIKE $${paramIndex} OR
                    vehicle_type ILIKE $${paramIndex}
                )`);
                params.push(`%${keyword}%`);
                paramIndex++;
            }
        });

        if (conditions.length === 0) return [];

        const query = `
            SELECT id, title, description, file_path, vehicle_type, 
                   SUBSTRING(COALESCE(content, ''), 1, 200) as content_preview
            FROM technical_manuals 
            WHERE ${conditions.join(' OR ')}
            ORDER BY 
                CASE 
                    WHEN title ILIKE $1 THEN 1
                    WHEN description ILIKE $1 THEN 2
                    WHEN vehicle_type ILIKE $1 THEN 3
                    ELSE 4
                END
            LIMIT 5
        `;

        try {
            const res = await pool.query(query, params);
            console.log(`🔍 Manual search found ${res.rows.length} results for keywords:`, keywords);
            return res.rows;
        } catch (e) {
            console.error('Error finding manuals:', e);
            return [];
        }
    }

    private static async findRelatedVehicles(keywords: string[]) {
        const pool = getPool();
        const conditions = keywords.map((_, i) => `(plate_number ILIKE $${i + 1} OR vehicle_type ILIKE $${i + 1})`).join(' OR ');
        if (!conditions) return [];

        const params = keywords.map(k => `%${k}%`);
        const query = `SELECT id, plate_number, vehicle_type, status FROM vehicles WHERE ${conditions} LIMIT 3`;

        try {
            const res = await pool.query(query, params);
            return res.rows;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    private static async findRelatedFaults(keywords: string[]) {
        const pool = getPool();
        const conditions = keywords.map((_, i) => `(title ILIKE $${i + 1} OR description ILIKE $${i + 1})`).join(' OR ');
        if (!conditions) return [];

        const params = keywords.map(k => `%${k}%`);
        const query = `SELECT id, title, description, status FROM faults WHERE ${conditions} LIMIT 3`;

        try {
            const res = await pool.query(query, params);
            return res.rows;
        } catch (e) {
            console.error(e);
            return [];
        }
    }
}
