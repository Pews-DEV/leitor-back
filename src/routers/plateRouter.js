require("dotenv").config();
const DB_CON = process.env.DB_STR_CON;
const express = require("express");

const axios = require("axios");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const FormData = require("form-data");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const { PassThrough } = require('stream');

const plateRouter = express.Router();

const User = require('../models/user');
const plate = require("../models/plate");

async function ocrSpace(image) {
  try {
    const formData = new FormData();

    formData.append("base64Image", image);
    formData.append("language", "eng");
    formData.append("isOverlayRequired", "false");
    formData.append("filetype", "base64Image");
    formData.append("detectOrientation", "false");
    formData.append("isCreateSearchablePdf", "false");
    formData.append("isSearchablePdfHideTextLayer", "false");
    formData.append("scale", "false");
    formData.append("isTable", "false");
    formData.append("OCREngine", "1");

    const request = {
      method: "POST",
      url: "https://api.ocr.space/parse/image",
      headers: {
        apikey: "K87082705488957",
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

function verifyToken(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ mensagem: 'Token não fornecido' });
  }

  try {
    const decoded = jwt.verify(token, 'chave_secreta'); // Use a mesma chave secreta usada para criar o token

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ mensagem: 'Token inválido' });
  }
}

function addCurrentDate(req, res, next) {
  req.body.date = new Date().toLocaleString();
  next();
}

plateRouter.post('/cadastro', async (req, res) => {
  try {
    const { login, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Criptografa a password

    await mongoose.connect(DB_CON);
    const user = await User.create({ login, password: hashedPassword });

    const token = jwt.sign({ id: user._id, login: user.login }, 'chave_secreta', {
      expiresIn: '1h' // Opcional: definir o tempo de expiração do token
    });

    res.json({ token });
  } catch (error) {
    res.status(500).json({
      error: true,
      mensagem: 'Erro durante o cadastro do usuário',
      tipo: error,
    });
  }
});


plateRouter.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body;

    await mongoose.connect(DB_CON);
    const user = await User.findOne({ login });

    if (!user) {
      return res.status(401).json({ mensagem: 'Credenciais incorretas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ mensagem: 'Credenciais incorretas' });
    }

    const token = jwt.sign({ login: user.login }, 'chave_secreta');

    res.json({ token });
  } catch (error) {
    res.status(500).json({
      error: true,
      mensagem: 'Erro durante o login',
      tipo: error,
    });
  }
});

plateRouter.get("/plates/all", verifyToken, async (req, res) => {
  try {
    await mongoose.connect(DB_CON);
    const platesSearched = await plate.find();
    res.json({ plates: platesSearched });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, mensagem: "Erro durante a consulta", tipo: error });
  }
});

plateRouter.get("/plate/:placa", verifyToken, async (req, res) => {
  try {
    await mongoose.connect(DB_CON);
    const plateNumber = req.params.placa;
    const foundPlate = await plate.findOne({ plate_number: plateNumber });
    if (!foundPlate) {
      return res
        .status(404)
        .json({ error: true, mensagem: "Placa não encontrada" });
    }
    res.json({ plate: foundPlate });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, mensagem: "Erro durante a consulta", tipo: error });
  }
});

plateRouter.post("/cadastroPlaca", verifyToken, addCurrentDate, async (req, res) => {
  try {
    const { city, image, date } = req.body;
    const data_plate = await ocrSpace(image);
    const plate_number = data_plate.ParsedResults[0].ParsedText.replace(
      "\r\n",
      ""
    ).replace(/[^a-zA-Z0-9]/g, "");

    await mongoose.connect(DB_CON);
    await plate.create({
      city: city,
      plate_number: plate_number,
      date: date,
      image: image,
    });
    res.json({ mensagem: "Cadastro realizado" });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, mensagem: "Erro durante o cadastro", tipo: error });
  }
});

plateRouter.get('/plates/report', verifyToken, async (req, res) => {
  try {
    await mongoose.connect(DB_CON);
    const allPlates = await plate.find();
    
    if (allPlates.length === 0) {
      return res.status(404).json({
        error: true,
        mensagem: 'Nenhuma placa encontrada no banco de dados',
      });
    }

    const doc = new PDFDocument();
    doc.fontSize(16).text('Relatório de Placas', { align: 'center' }).moveDown();

    allPlates.forEach((plateInfo) => {
      doc.text(`Placa: ${plateInfo.plate_number}`);
      doc.moveDown();
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=placas_report.pdf');

    const pdfStream = new PassThrough();
    doc.pipe(pdfStream);
    doc.end();

    pdfStream.pipe(res);

  } catch (error) {
    res.status(500).json({
      error: true,
      mensagem: 'Erro durante a geração do relatório',
      tipo: error,
    });
  }
});

module.exports = plateRouter;
