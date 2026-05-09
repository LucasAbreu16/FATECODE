const express         = require('express');
const router          = express.Router();
const GroupController = require('../controllers/groupController');
const { requireAuth } = require('./middleware');

router.get('/',             GroupController.search);          // Buscar grupos
router.get('/my',           requireAuth, GroupController.myGroups);
router.get('/:id',          GroupController.getOne);
router.post('/',            requireAuth, GroupController.create);  // Criar grupo
router.post('/:id/join',    requireAuth, GroupController.join);
router.delete('/:id/leave', requireAuth, GroupController.leave);   // Sair do grupo

module.exports = router;
