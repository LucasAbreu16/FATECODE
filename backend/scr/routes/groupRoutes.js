const express = require('express');
const router = express.Router();
const GroupController = require('../controllers/groupController');
const { requireAuth } = require('./middleware');

router.get('/',              GroupController.search);
router.get('/my',            requireAuth, GroupController.myGroups);
router.get('/:id',           GroupController.getOne);
router.post('/',             requireAuth, GroupController.create);
router.post('/:id/join',     requireAuth, GroupController.join);
router.delete('/:id/leave',  requireAuth, GroupController.leave);

module.exports = router;
