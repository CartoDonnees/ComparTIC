
import { JWT_TOKEN } from '@/services/tools/constants';

export default function handler(req, res) {
    const token = req.cookies[JWT_TOKEN] || null;
    res.status(200).json({ token });
}