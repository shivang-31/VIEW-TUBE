import express from 'express';
import { search,getSearchSuggestions } from '../controllers/searchController.js';

const router = express.Router();

router.get('/',search);
router.get('/suggestions',getSearchSuggestions);

export default router;