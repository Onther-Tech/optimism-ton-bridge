const { artifacts, ethers } = require('hardhat');
const { join } = require('path');
const { readFileSync } = require('fs');

async function deployContract (
  signer,
  artifact,
  args,
) {
  const contractFactory = new ethers.ContractFactory(artifact.interface, artifact.bytecode, signer);
  const contract = await contractFactory.deploy(...args);

  await contract.deployed();

  return contract;
}

async function getL2ContractFactory (name) {
  const l1ArtifactPaths = await artifacts.getArtifactPaths();
  const desiredArtifacts = l1ArtifactPaths.filter((a) => a.endsWith(`/${name}.json`));
  if (desiredArtifacts.length !== 1) {
    console.error('Couldn\'t find desired artifact or found too many');
  }

  const l1ArtifactPath = desiredArtifacts[0];
  const artifactRootPath = join(__dirname, '../../artifacts');
  const artifactOvmRootPath = join(__dirname, '../../artifacts-ovm');
  const l2ArtifactPath = l1ArtifactPath.replace(artifactRootPath, artifactOvmRootPath);

  const artifact = JSON.parse(readFileSync(l2ArtifactPath, 'utf-8'));

  return new ethers.ContractFactory(artifact.abi, artifact.bytecode);
}

async function waitForTx (tx) {
  const resolvedTx = await tx;
  return await resolvedTx.wait();
}

module.exports = {
  deployContract,
  getL2ContractFactory,
  waitForTx,
};
