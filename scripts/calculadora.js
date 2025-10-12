(() => {
        const nomeInput = document.getElementById('nome');
        const potenciaInput = document.getElementById('potencia');
        const valorKWhInput = document.getElementById('valorKWh');
        const tempoUsoInput = document.getElementById('tempoUso');
        const valorContaInput = document.getElementById('valorConta');

        const btnCalcular = document.getElementById('calcular');
        const resultadoDiv = document.getElementById('resultado');
        const resumoP = document.getElementById('resumo');
        const valorkWhTd = document.getElementById('valorKWhMensal');
        const gastoMensalTd = document.getElementById('gastoMensal');
        const porcentagemContaTd = document.getElementById('porcentagemConta');
        const avisoExcedeuDiv = document.getElementById('avisoExcedeu');

        btnCalcular.addEventListener('click', () => {
            const nome = nomeInput.value.trim();
            const potencia = parseFloat(potenciaInput.value);
            const valorKWh = parseFloat(valorKWhInput.value);
            const tempoUso = parseFloat(tempoUsoInput.value);
            const valorConta = parseFloat(valorContaInput.value);

            if (!nome) {
                alert('Por favor, preencha o nome do aparelho.');
                nomeInput.focus();
                return;
            }
            if (isNaN(potencia) || potencia <= 0) {
                alert('Por favor, informe uma potência válida (maior que zero).');
                potenciaInput.focus();
                return;
            }
            if (isNaN(valorKWh) || valorKWh <= 0) {
                alert('Por favor, informe um valor válido para o KWh (maior que zero).');
                valorKWhInput.focus();
                return;
            }
            if (isNaN(tempoUso) || tempoUso < 0 || tempoUso > 24) {
                alert('Por favor, informe um tempo de uso diário entre 0 e 24 horas.');
                tempoUsoInput.focus();
                return;
            }
            if (isNaN(valorConta) || valorConta <= 0) {
                alert('Por favor, informe um valor válido para a conta de energia (maior que zero).');
                valorContaInput.focus();
                return;
            }

            // Cálculo consumo
            const consumoDiarioKWh = (potencia / 1000) * tempoUso;
            const consumoMensalKWh = consumoDiarioKWh * 30;
            const gastoMensal = consumoMensalKWh * valorKWh;
            const porcentagemConta = (gastoMensal / valorConta) * 100;

            resumoP.textContent = `O aparelho "${nome}" está gastando aproximadamente R$ ${gastoMensal.toFixed(2)} por mês.`;
            valorkWhTd.textContent = valorKWh.toFixed(2);
            gastoMensalTd.textContent = gastoMensal.toFixed(2);
            porcentagemContaTd.textContent = porcentagemConta.toFixed(2) + '%';

            resultadoDiv.style.display = 'block';

            if(gastoMensal > valorConta) {
                avisoExcedeuDiv.style.display = 'block';
                avisoExcedeuDiv.textContent = `Atenção! O gasto calculado para o aparelho ultrapassa o valor médio da sua conta de energia. Verifique os dados informados ou considere o consumo do aparelho.`;
            } else {
                avisoExcedeuDiv.style.display = 'none';
                avisoExcedeuDiv.textContent = '';
            }
        });
    })();