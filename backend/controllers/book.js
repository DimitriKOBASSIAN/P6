const Book = require('../models/book');
const fs = require('fs');

// Create a new book
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

// Get one book
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

// Modify a book
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
              .then(() => res.status(200).json({message : 'Book modified!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};
// Delete a book
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Book deleted !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};
// Get all books
exports.getBooks = async (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(404).json({ error }));
};

// Get the 3 best rated books
exports.getBestRatedBooks  = async (req, res) => {
  try {
    const books =  await Book.find()
      .sort({ averageRating: -1 })
      .limit(3);
    return res.status(200).json(books);
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Error during getting best rating" });
  }
};

// Create a rating
exports.createRating = (req, res) => {
    try {
      const { rating } = req.body;
      if (rating < 0 || rating > 5) {
        return res
          .status(400)
          .json({ message: "The rating must be between 1 to 5" });
      }
  
      const book =  Book.findById(req.params.id);
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
  
      book.save();
      return res.status(201).json(book);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error during rating creation" });
    }
  };

