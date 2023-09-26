const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const mongoose = require('mongoose');
const plate = require('../models/plate');

const plateRouter = express.Router();

// Função para fazer o reconhecimento de caracteres (OCR)
async function ocrSpace(image) {
  try {
    const formData = new FormData();

    formData.append("base64Image", image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('filetype', 'base64Image');
    formData.append('detectOrientation', 'false');
    formData.append('isCreateSearchablePdf', 'false');
    formData.append('isSearchablePdfHideTextLayer', 'false');
    formData.append('scale', 'false');
    formData.append('isTable', 'false');
    formData.append('OCREngine', '1');

    const request = {
      method: 'POST',
      url: 'https://api.ocr.space/parse/image',
      headers: {
        apikey: 'K87082705488957', // Coloque sua chave aqui
        ...formData.getHeaders(),
      },
      data: formData,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };

    const { data } = await axios(request);
    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

plateRouter.get('/', async (req, res) => {
  try {
    console.log(process.env.API_KEY_TESTE)
    res.send(process.env.API_KEY_TESTE);
  } catch (error) {
    res.send('Error')
  }
});

// Rota para obter todas as placas
plateRouter.get('/plates/all', async (req, res) => {
  try {
    await mongoose.connect(process.env.DB_STR_CON);
    const platesSearched = await plate.find();
    res.json({ plates: platesSearched });
  } catch (error) {
    res.status(500).json({ error: true, mensagem: 'Erro durante a consulta', tipo: error });
  }
});

// Rota para inserir uma nova placa no BD
plateRouter.post('/cadastroPlaca', async (req, res) => {
  try {
    const { city, image } = req.body;
    const data_plate = await ocrSpace(image);
    const plate_number = data_plate.ParsedResults[0].ParsedText.replace('\r\n', '').replace(/[^a-zA-Z0-9]/g, '');

    await mongoose.connect(process.env.DB_STR_CON);
    await plate.create({ city: city, plate_number: plate_number, date: "15/02/2023 10:50" });
    res.json({ mensagem: 'Cadastro realizado' });
  } catch (error) {
    res.status(500).json({ error: true, mensagem: 'Erro durante o cadastro', tipo: error });
  }
});

module.exports = plateRouter;
