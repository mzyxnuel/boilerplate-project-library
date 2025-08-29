/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const { MongoClient, ObjectId } = require('mongodb');

let db;
let books = []; // Fallback in-memory storage

// Connect to MongoDB
MongoClient.connect(process.env.DB)
  .then(client => {
    console.log('Connected to MongoDB');
    db = client.db('personal-library');
  })
  .catch(err => {
    console.log('Database connection failed, using in-memory storage:', err.message);
    db = null;
  });

module.exports = function (app) {

  app.route('/api/books')
    .get(async function (req, res){
      try {
        if (db) {
          const booksFromDb = await db.collection('books').find({}).toArray();
          const booksWithCommentCount = booksFromDb.map(book => ({
            _id: book._id,
            title: book.title,
            commentcount: book.comments ? book.comments.length : 0
          }));
          res.json(booksWithCommentCount);
        } else {
          // Use in-memory storage
          const booksWithCommentCount = books.map(book => ({
            _id: book._id,
            title: book.title,
            commentcount: book.comments ? book.comments.length : 0
          }));
          res.json(booksWithCommentCount);
        }
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    })
    
    .post(async function (req, res){
      let title = req.body.title;
      
      if (!title) {
        return res.send('missing required field title');
      }
      
      try {
        if (db) {
          const newBook = {
            title: title,
            comments: []
          };
          
          const result = await db.collection('books').insertOne(newBook);
          res.json({
            _id: result.insertedId,
            title: title
          });
        } else {
          // Use in-memory storage
          const newBook = {
            _id: new ObjectId().toString(),
            title: title,
            comments: []
          };
          books.push(newBook);
          res.json({
            _id: newBook._id,
            title: title
          });
        }
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    })
    
    .delete(async function(req, res){
      try {
        if (db) {
          await db.collection('books').deleteMany({});
        } else {
          books = [];
        }
        res.send('complete delete successful');
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });



  app.route('/api/books/:id')
    .get(async function (req, res){
      let bookid = req.params.id;
      
      try {
        if (db) {
          if (!ObjectId.isValid(bookid)) {
            return res.send('no book exists');
          }
          
          const book = await db.collection('books').findOne({ _id: new ObjectId(bookid) });
          
          if (!book) {
            return res.send('no book exists');
          }
          
          res.json({
            _id: book._id,
            title: book.title,
            comments: book.comments || []
          });
        } else {
          // Use in-memory storage
          const book = books.find(b => b._id === bookid);
          
          if (!book) {
            return res.send('no book exists');
          }
          
          res.json({
            _id: book._id,
            title: book.title,
            comments: book.comments || []
          });
        }
      } catch (error) {
        res.send('no book exists');
      }
    })
    
    .post(async function(req, res){
      let bookid = req.params.id;
      let comment = req.body.comment;
      
      if (!comment) {
        return res.send('missing required field comment');
      }
      
      try {
        if (db) {
          if (!ObjectId.isValid(bookid)) {
            return res.send('no book exists');
          }
          
          const book = await db.collection('books').findOne({ _id: new ObjectId(bookid) });
          
          if (!book) {
            return res.send('no book exists');
          }
          
          await db.collection('books').updateOne(
            { _id: new ObjectId(bookid) },
            { $push: { comments: comment } }
          );
          
          const updatedBook = await db.collection('books').findOne({ _id: new ObjectId(bookid) });
          
          res.json({
            _id: updatedBook._id,
            title: updatedBook.title,
            comments: updatedBook.comments
          });
        } else {
          // Use in-memory storage
          const book = books.find(b => b._id === bookid);
          
          if (!book) {
            return res.send('no book exists');
          }
          
          book.comments.push(comment);
          
          res.json({
            _id: book._id,
            title: book.title,
            comments: book.comments
          });
        }
      } catch (error) {
        res.send('no book exists');
      }
    })
    
    .delete(async function(req, res){
      let bookid = req.params.id;
      
      try {
        if (db) {
          if (!ObjectId.isValid(bookid)) {
            return res.send('no book exists');
          }
          
          const result = await db.collection('books').deleteOne({ _id: new ObjectId(bookid) });
          
          if (result.deletedCount === 0) {
            return res.send('no book exists');
          }
          
          res.send('delete successful');
        } else {
          // Use in-memory storage
          const bookIndex = books.findIndex(b => b._id === bookid);
          
          if (bookIndex === -1) {
            return res.send('no book exists');
          }
          
          books.splice(bookIndex, 1);
          res.send('delete successful');
        }
      } catch (error) {
        res.send('no book exists');
      }
    });
  
};
