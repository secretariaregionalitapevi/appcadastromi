const test = require("node:test");
const assert = require("node:assert/strict");

const { detectDuplicate } = require("../src/server");

const nicolly = {
  id: "nicolly",
  tipo: "monitor",
  payload: {
    nome_completo: "NICOLLY SANTIAGO BRAGA REIS",
    comum_congregacao: "BR-22-0424 - PEDRAS - COTIA",
    celular: "11962056322",
    email: "nicolly@example.com"
  }
};

test("irmaos com sobrenomes, comum e celular iguais nao sao duplicados", () => {
  const result = detectDuplicate("monitor", {
    nome_completo: "ELIZEU SANTIAGO BRAGA DOS REIS",
    comum_congregacao: "BR-22-0424 - PEDRAS - COTIA",
    celular: "11962056322",
    email: "elizeu.santiago.reis@gmail.com"
  }, [nicolly]);

  assert.deepEqual(result, { duplicate: false });
});

test("mesmo email continua sendo duplicidade", () => {
  const result = detectDuplicate("monitor", {
    nome_completo: "OUTRA PESSOA",
    comum_congregacao: "OUTRA COMUM",
    celular: "11999999999",
    email: "NICOLLY@example.com"
  }, [nicolly]);

  assert.equal(result.duplicate, true);
  assert.equal(result.reason, "email");
});

test("mesmo nome completo na mesma comum continua sendo duplicidade", () => {
  const result = detectDuplicate("monitor", {
    nome_completo: "Nicolly Santiago Braga Reis",
    comum_congregacao: "BR-22-0424 - PEDRAS - COTIA",
    celular: "11888888888",
    email: "outro@example.com"
  }, [nicolly]);

  assert.equal(result.duplicate, true);
  assert.equal(result.reason, "nome_e_comum");
});
