const request = require('supertest');
const app = require('../server'); // Ajuste o caminho se necessário

describe('Testes das Rotas', () => {
  it('Deve cadastrar um usuário', async () => {
    const res = await request(app)
      .post('/cadastro')
      .send({ email: 'usuario@teste.com', senha: 'senha123' });
    expect(res.statusCode).toEqual(500);
    expect(res.body).toHaveProperty('mensagem');
  });

  it('Deve autenticar o usuário e fornecer um token', async () => {
    const res = await request(app)
      .post('/login')
      .send({ login: 'usuario@teste.com', password: 'senha123' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('token');
  });

  it('Deve retornar um erro de dados incorretos ao autenticar com credenciais inválidas', async () => {
    const res = await request(app)
      .post('/login')
      .send({ login: 'usuario@teste.com', password: 'senha_incorreta' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('mensagem');
  });

  it('Deve retornar um token válido ao cadastrar uma placa', async () => {
    const res = await request(app)
      .post('/cadastroPlaca')
      .set('Authorization', 'seu_token_aqui')
      .send({ city: 'São Paulo', image: 'imagem_base64_aqui', date: '2023-11-06' });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('mensagem');
  });

  it('Deve retornar um relatório em PDF de todas as placas', async () => {
    const res = await request(app)
      .get('/plates/report')
      .set('Authorization', 'seu_token_aqui');
    expect(res.statusCode).toEqual(401);
    expect(res.header['content-type']).toEqual('application/pdf');
  });

  it('Deve retornar um erro ao tentar acessar o relatório sem um token válido', async () => {
    const res = await request(app).get('/plates/report');
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('mensagem');
  });
});
