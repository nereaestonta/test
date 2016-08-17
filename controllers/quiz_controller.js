var models = require('../models/models.js');

// Autoload - factoriza el código si la ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.find({
		where: { id: Number(quizId) },
		include: [{ model: models.Comment }]
	}).then(
		function(quiz) {
			if (quiz) {
				req.quiz = quiz;
				next();
			} else {
				next(new Error('No existe quizId=' + quizId));
			}
		}
	).catch(function(error) {
		next(error);
	});
};

// GET /quizes
exports.index = function(req, res) {
	if (req.query.search) {
		var search = '%' + req.query.search + '%';
		search = search.replace(' ', '%').toLowerCase();
		models.Quiz.findAll({where: ['lower(pregunta) like ?', search], order: 'pregunta ASC'}).then(
			function(quizes) {
				res.render('quizes/index', { quizes: quizes, errors: [] });
			}
		).catch(function(error) {
			next(error);
		});
	} else {
		models.Quiz.findAll().then(
			function(quizes) {
				res.render('quizes/index', { quizes: quizes, errors: [] });
			}
		).catch(function(error) {
			next(error);
		});
	}
};

// GET /quizes/:id
exports.show = function(req, res) {
	res.render('quizes/show', { quiz: req.quiz, errors: [] });
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
	var resultado = 'Incorrecto';
	if (req.query.respuesta === req.quiz.respuesta) {
		resultado = 'Correcto';
	}
	res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
};

// GET /quizes/new
exports.new = function(req, res) {
	var quiz = models.Quiz.build( 	// crea el objeto quiz
		{ pregunta: "Pregunta", respuesta: "Respuesta", tema: "Tema" }
	);
	res.render('quizes/new', { quiz: quiz, errors: [] });
};

// GET /author
exports.author = function(req, res){
	res.render('author', { errors: [] });
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz; 		// autoload de la instancia de quiz
	res.render('quizes/edit', { quiz: quiz, errors: [] });
};

// POST /quizes/create
exports.create = function(req, res) {
	var quiz = models.Quiz.build(req.body.quiz);
	quiz
	.validate()
	.then(
		function(err) {
			if (err) {
				res.render('quizes/new', {quiz: quiz, errors: err.errors});
			} else {
				quiz
				.save({fields: ["pregunta", "respuesta", "tema"]}) 			// guarda en bbdd los campos pregunta y respuesta de quiz
				.then(function() {res.redirect('/quizes')}) 		// redirección HTTP a url relativo de lista de preguntas
			}
		}
	);
};

// PUT /quizes/:id
exports.update = function(req, res) {
	req.quiz.pregunta = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta;
	req.quiz.tema = req.body.quiz.tema;
	req.quiz
	.validate()
	.then(
		function(err) {
			if (err) {
				res.render('quizes/edit', {quiz: quiz, errors: err.errors});
			} else {
				req.quiz
				.save({fields: ["pregunta", "respuesta", "tema"]}) 			// guarda en bbdd los campos pregunta y respuesta de quiz
				.then(function() {res.redirect('/quizes')}) 		// redirección HTTP a url relativo de lista de preguntas
			}
		}
	);
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
	req.quiz.destroy().then(function() {
		res.redirect('/quizes');
	}).catch(function(error) { next(error) });
};

// GET /quizes/statistics
exports.statistics = function(req, res) {
	var questionsAmount = 0;
	var hasComments = 0;
	models.Quiz.count().then(
		function(questionsAmountN) {
			questionsAmount = questionsAmountN;
			return models.Comment.count();
		}
	).then(
		function(commentsAmountN) {
			commentsAmount = commentsAmountN;
			return models.Comment.questionsWithComments();
		}
	).then(
		function(hasCommentsN) {
			hasComments = hasCommentsN;
		}
	).catch(
		function(error) { next(error); }
	).finally(function() {
		var commentsMedia = (commentsAmount / questionsAmount).toFixed(2);
		var withoutComments = questionsAmount - commentsAmount;
		res.render('statistics', { questionsAmount: questionsAmount, commentsAmount: commentsAmount, commentsMedia: commentsMedia, withoutComments: withoutComments, hasComments: hasComments, errors: [] });
	});
};