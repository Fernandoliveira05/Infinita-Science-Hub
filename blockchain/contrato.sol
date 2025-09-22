// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RepositoryRegistry
 * @dev Este contrato armazena hashes de repositórios científicos que foram
 * validados por uma IA. Apenas o dono do contrato (o backend da plataforma)
 * pode registrar novos repositórios, garantindo a integridade dos dados.
 */
contract RepositoryRegistry is Ownable {

    struct RepositoryRecord {
        bytes32 repoHash;      // O hash do conteúdo do repositório.
        address owner;         // O endereço da carteira do dono original.
        uint256 timestamp;     // O timestamp do bloco em que foi registrado.
    }

    // Mapeamento do ID do repositório (ex: UUID do Supabase) para o seu registro on-chain.
    mapping(string => RepositoryRecord) public records;

    // Evento emitido quando um novo repositório é registrado com sucesso.
    event RepositoryRegistered(
        string indexed repoId,
        bytes32 repoHash,
        address indexed owner,
        uint256 timestamp
    );

    /**
     * @dev Construtor que define o dono inicial do contrato.
     * @param initialOwner O endereço que será o dono do contrato (sua carteira de backend).
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Registra um novo repositório validado na blockchain.
     * Apenas o dono do contrato pode chamar esta função.
     * @param _repoId O ID único do repositório (vindo do seu banco de dados).
     * @param _repoHash O hash SHA-256 do conteúdo/metadados do repositório.
     * @param _owner O endereço do dono original do repositório.
     */
    function registerRepository(string memory _repoId, bytes32 _repoHash, address _owner) public onlyOwner {
        // Garante que o repositório ainda não foi registrado para evitar duplicatas.
        require(records[_repoId].owner == address(0), "Repository already registered");
        // Garante que o hash não seja vazio.
        require(_repoHash != bytes32(0), "Hash cannot be empty");

        // Cria e armazena o novo registro.
        records[_repoId] = RepositoryRecord({
            repoHash: _repoHash,
            owner: _owner,
            timestamp: block.timestamp
        });

        // Emite o evento para que serviços externos possam escutar.
        emit RepositoryRegistered(_repoId, _repoHash, _owner, block.timestamp);
    }
}