# app/services/blockchain_service.py

import json  # <-- ADICIONADO: Para ler o arquivo ABI
import hashlib
from web3 import Web3
from app.core.config import settings  # <-- ADICIONADO: Para acessar as variáveis de ambiente
from app.services import supabase_service

# --- Configuração do Web3 ---
# Conecta-se ao nó Ethereum usando a URL do nosso .env
w3 = Web3(Web3.HTTPProvider(settings.ETHEREUM_NODE_URL))

# Carrega a conta do servidor a partir da chave privada no .env
# Esta é a conta que será a "dona" do contrato e pagará pelo gás
server_account = w3.eth.account.from_key(settings.SERVER_PRIVATE_KEY)
w3.eth.default_account = server_account.address

# --- Carregamento do Contrato ---
try:
    # Carrega o ABI do contrato (a "receita" de como interagir com ele)
    # Certifique-se de que este caminho está correto no seu projeto!
    with open("app/core/abi/RepositoryRegistry.json", "r") as f:
        # O arquivo gerado pelo Hardhat tem o ABI dentro de uma chave "abi"
        contract_abi = json.load(f)["abi"]

    # Cria uma instância do contrato com a qual podemos interagir
    contract = w3.eth.contract(address=settings.CONTRACT_ADDRESS, abi=contract_abi)

except FileNotFoundError:
    print("ERRO CRÍTICO: O arquivo ABI do contrato 'RepositoryRegistry.json' não foi encontrado.")
    print("Certifique-se de que o caminho 'app/core/abi/RepositoryRegistry.json' está correto.")
    contract = None # Define como None para evitar erros posteriores se o arquivo não existir


def calculate_repository_hash(repo_id: str) -> str:
    """
    Calcula um hash determinístico para um repositório.
    Esta função é crucial para a integridade dos dados on-chain.
    """
    blocks = supabase_service.list_blocks_for_repo(repo_id)
    
    # Ordena os blocos por data de criação para garantir que o hash seja sempre o mesmo
    blocks.sort(key=lambda b: b['created_at'])
    
    full_content = ""
    for block in blocks:
        # Concatena os campos importantes de cada bloco
        full_content += block.get('title', '')
        full_content += block.get('description', '')
        full_content += str(block.get('content', ''))

    # Gera o hash SHA-256 e o retorna como uma string hexadecimal com prefixo "0x"
    hash_object = hashlib.sha256(full_content.encode('utf-8'))
    return "0x" + hash_object.hexdigest()


async def register_repository_on_chain(repo_id: str, repo_hash: str, owner_address: str) -> str:
    """
    Constrói, assina e envia uma transação para a função `registerRepository` do contrato.
    """
    if not contract:
        raise Exception("Instância do contrato não está disponível. Verifique o log de erros.")

    try:
        # Converte o hash hexadecimal (string) em bytes
        repo_hash_bytes = bytes.fromhex(repo_hash[2:])
        
        # Constrói a transação
        tx_data = contract.functions.registerRepository(
            repo_id,
            repo_hash_bytes,
            w3.to_checksum_address(owner_address)
        ).build_transaction({
            'from': server_account.address,
            'nonce': w3.eth.get_transaction_count(server_account.address),
            # Em redes de teste, podemos deixar o web3 estimar o gás
            # 'gas': 200000, 
            # 'gasPrice': w3.eth.gas_price,
        })

        # Assina a transação com a chave privada do servidor
        signed_tx = w3.eth.account.sign_transaction(tx_data, settings.SERVER_PRIVATE_KEY)
        
        # Envia a transação para a rede
        tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
        
        # Opcional, mas recomendado para ter certeza: esperar pela confirmação
        # receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
        
        return tx_hash.hex()
    except Exception as e:
        print(f"Erro ao construir ou enviar a transação: {e}")
        raise e