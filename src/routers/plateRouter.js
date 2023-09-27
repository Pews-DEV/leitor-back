require("dotenv").config();
const DB_CON = process.env.DB_STR_CON;
const express = require("express");
const axios = require("axios");

const FormData = require("form-data");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const { PassThrough } = require('stream');

const plateRouter = express.Router();

const plate = require("../models/plate");

// Função para fazer o reconhecimento de caracteres (OCR)
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
        apikey: "K87082705488957", // Coloque sua chave aqui
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

// Rota para obter todas as placas
plateRouter.get("/plates/all", async (req, res) => {
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

plateRouter.get("/plate/:placa", async (req, res) => {
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

// Middleware para adicionar a data atual
function addCurrentDate(req, res, next) {
  req.body.date = new Date().toLocaleString(); // Obtém a data atual no formato desejado
  next(); // Chama o próximo middleware na cadeia ou a rota principal
}

// Rota para cadastrar uma nova placa com o middleware addCurrentDate
plateRouter.post("/cadastroPlaca", addCurrentDate, async (req, res) => {
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
      date: date, // Usar a data fornecida pelo middleware
      image: image,
    });
    res.json({ mensagem: "Cadastro realizado" });
  } catch (error) {
    res
      .status(500)
      .json({ error: true, mensagem: "Erro durante o cadastro", tipo: error });
  }
});


plateRouter.get('/plates/report', async (req, res) => {
  try {
    await mongoose.connect(DB_CON);
    const allPlates = await plate.find();
    
    if (allPlates.length === 0) {
      return res.status(404).json({
        error: true,
        mensagem: 'Nenhuma placa encontrada no banco de dados',
      });
    }

    // Crie um documento PDF em memória
    const doc = new PDFDocument();

    // Configurar o cabeçalho do PDF
    doc.fontSize(16).text('Relatório de Placas', { align: 'center' }).moveDown();

    // Preencha o conteúdo do PDF com as informações das placas
    allPlates.forEach((plateInfo) => {
      doc.text(`Placa: ${plateInfo.plate_number}`);
      doc.moveDown();
    });

    // Configurar o cabeçalho para o navegador entender que estamos enviando um PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=placas_report.pdf');

    // Crie um fluxo de leitura para o PDF em memória
    const pdfStream = new PassThrough();
    doc.pipe(pdfStream);
    doc.end();

    // Envie o PDF diretamente para o cliente
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
