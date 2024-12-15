const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const xml2js = require('xml2js');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/auth')
  .then(() => console.log('Conectado a MongoDB'))
  .catch((error) => console.error('Error al conectar a MongoDB', error));

// --USER SIGNUP LOGIN--

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  disease: String,
  random: String
});

const Disease = mongoose.model('Disease', new mongoose.Schema({
  name: String,
  symptoms: [String]
}));

const Symptom = mongoose.model('Symptom', new mongoose.Schema({
  name: String
}));

const User = mongoose.model('User', userSchema);
  
app.use(express.json());
app.use(express.static('public'));
app.use((req, res, next) => {
  if(req.path.endsWith('.js'))
  {
    res.setHeader('Content-Type', 'application/javascript');
  }
  next();
});

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if(existingUser)
    {
      console.log('MAL');
      return res.status(400).json({ success: false, message: 'El usuari ja existeix!'});  
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = new User({
      username: req.body.username,
      password: hashedPassword,
    });

    await newUser.save();
    const id = newUser._id;
    res.status(201).json({ success: true, message: 'Usuari registrat!', 
      redirectUrl: `/api/user/${id}`});
  } catch (error){
    res.status(500).json({ error: toString(error) });
  }
});

// LOGIN
app.post('/', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if(!user)
    {
      return res.status(401).json({ success: false, message: 'Les credencials son incorrectes.' });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, user.password);
    if(!passwordMatch)
    {
      return res.status(401).json({ success: false, message: 'La contrassenya es incorrecte.' });
    }
    
    const id = user._id;
    //const token = jwt.sign({ username: user.username }, 'secret');
    return res.status(200).json({ success: true, redirectUrl: `/api/user/${id}`});
    //res.status(200).json({ token });
  } catch (error){
    res.status(500).json({ success: false, message: 'Error al servidor.' });
  }
});

//GET USER DETAILS
app.get('/api/user/:id', async (req, res) => {
  const userId = req.params.id;
  res.sendFile(path.join(__dirname, 'public', ''));
  try {
    const user = await User.findById(userId); 
    if(!user) {
      return res.status(404).json({ error: `L'usuari ${userId} no existeix.` });
    }
    res.status(200).json({ username: user.username });

    const diseases = await Disease.find();
    let diseaseScores = {};

    diseases.forEach(disease => {
      diseaseScores[disease.name] = 0;
      console.log(diseaseScores[disease.name]);
    })

  } catch {
    res.status(500).json({ error: 'Error de servidor.' });
  }

  // Selection of diseases

});

async function fetchMedicalArticles()
{
  const query = 'respiratory diseases';
  const apiUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${query}&retmax=5&retmode=json`;

  try {
    const response = await axios.get(apiUrl);
    const articleIds = response.data.esearchresult.idlist;

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${articleIds.join(',')}&retmode=json`;
    const articleSummary = await axios.get(summaryUrl);

    const articles = articleSummary.data.result;
    console.log(articles);
    return articles;
  } catch (error) {
    console.error('Error fetching articles: ' + error);
    return null;
  }
}

async function AnalizeArticle()
{

}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    //const articles = fetchMedicalArticles();
    //console.log(articles);
});