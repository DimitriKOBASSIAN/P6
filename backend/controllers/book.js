const Book = require('../models/book');
const auth = require('../middleware/auth');
const fs = require('fs');

exports.createBook = (req, res, next) => {
const bookObject = JSON.parse(req.body.book);
delete bookObject._id;
delete bookObject.userId;
const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
});


  book.save()
      .then(() => {res.status(201).json({ message: "Book Saved !" });
      })
      .catch((error) => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;
  Book.findOne({_id: req.params.id})
      .then((book) => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllBooks = (req, res, next) => {
    Book.find().then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.createRating = async (req, res) => {
    try {
      const { rating } = req.body;
      if (rating < 0 || rating > 5) {
        return res
          .status(400)
          .json({ message: "The rating must be between 1 to 5" });
      }
  
      const book = await Book.findById(req.params.id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
  
      const userIdArray = book.ratings.map((rating) => rating.userId);
      if (userIdArray.includes(req.auth.userId)) {
        return res.status(403).json({ message: "Not authorized" });
      }
  
      book.ratings.push({ ...req.body, grade: rating });
  
      const totalGrades = book.ratings.reduce(
        (sum, rating) => sum + rating.grade,
        0
      );
      book.averageRating = (totalGrades / book.ratings.length).toFixed(1);
  
      await book.save();
      return res.status(201).json(book);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error during rating creation" });
    }
  };

exports.getBestRating = (req, res, next) => {
    Book.find().sort ({averageRating: -1}).limit(5).then(
    (book) => { res.status(200).json(book); }
  ).catch(
    (error) => {res.status(400).json({ error: error});});
};