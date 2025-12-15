from PIL import Image
import os
import math

# === CONFIGURAÇÕES ===
# Caminhos relativos a partir da pasta onde o script é executado (se rodar da raiz)
# Ajuste conforme necessário
INPUT_PATH = 'src/images/logo-cce.png'
OUTPUT_PATH = 'src/images/logo-animado.gif'

# Parâmetros da animação
FRAMES = 30           # Total de quadros
DURATION = 50         # Duração de cada quadro em ms (50ms = 20fps)
MAX_SCALE = 1.15      # Aumento máximo (1.15 = 15% maior)

def create_pulse_gif():
    # Verifica se o arquivo existe
    if not os.path.exists(INPUT_PATH):
        # Tenta ajustar o caminho caso esteja rodando de dentro da pasta scripts
        alt_path = '../' + INPUT_PATH
        if os.path.exists(alt_path):
            input_file = alt_path
            output_file = '../' + OUTPUT_PATH
        else:
            print(f"❌ Erro: Imagem não encontrada em '{INPUT_PATH}' nem em '{alt_path}'")
            return
    else:
        input_file = INPUT_PATH
        output_file = OUTPUT_PATH

    print(f"📂 Lendo imagem: {input_file}")
    
    try:
        # Carregar imagem original
        original = Image.open(input_file).convert("RGBA")
        width, height = original.size
        
        frames = []
        
        # Tamanho do canvas (baseado no tamanho máximo que a imagem vai atingir)
        canvas_w = int(width * MAX_SCALE)
        canvas_h = int(height * MAX_SCALE)
        
        print("⚙️ Gerando quadros...")
        
        # Gerar quadros
        for i in range(FRAMES):
            # Cria um canvas transparente
            frame = Image.new("RGBA", (canvas_w, canvas_h), (255, 255, 255, 0))
            
            # Calcular fator de escala usando seno (vai de 0 a 1 e volta a 0)
            # math.sin vai de 0 a PI
            angle = (i / FRAMES) * math.pi
            scale_factor = 1 + (math.sin(angle) * (MAX_SCALE - 1))
            
            # Calcular novo tamanho
            new_w = int(width * scale_factor)
            new_h = int(height * scale_factor)
            
            # Redimensionar imagem (LANCZOS é melhor qualidade)
            resized = original.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
            # Centralizar no canvas
            pos_x = (canvas_w - new_w) // 2
            pos_y = (canvas_h - new_h) // 2
            
            # Colar a imagem redimensionada no canvas transparente
            frame.paste(resized, (pos_x, pos_y), resized)
            
            frames.append(frame)

        # Salvar GIF
        print(f"💾 Salvando GIF em: {output_file}")
        frames[0].save(
            output_file,
            save_all=True,
            append_images=frames[1:],
            optimize=True,
            duration=DURATION,
            loop=0, # 0 = loop infinito
            disposal=2 # Limpa o quadro anterior (importante para transparência)
        )
        print("✅ Sucesso! GIF gerado.")

    except Exception as e:
        print(f"❌ Erro ao processar: {e}")

if __name__ == "__main__":
    create_pulse_gif()
