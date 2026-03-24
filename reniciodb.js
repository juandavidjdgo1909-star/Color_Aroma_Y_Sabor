app.delete('/reset-db', async (req, res) => {
  try {
    await mongoose.connection.db.dropDatabase();
    res.send('Base de datos reiniciada');
  } catch (error) {
    res.status(500).send(error.message);
  }
});