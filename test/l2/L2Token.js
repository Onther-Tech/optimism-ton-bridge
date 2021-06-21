const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy } = require('../helpers');

const name = 'ERC20 Token Layer 2';
const symbol = 'TOKEN-L2';

const mintAmount = 100;
const burnAmount = 10;

describe('L2Token', () => {
  beforeEach(async () => {
    this.token = await deploy('L2Token', [name, symbol]);
  });

  it('name, symbol, decimals, owner', async () => {
    const [deployer] = await ethers.getSigners();

    expect(await this.token.name()).to.eq(name);
    expect(await this.token.symbol()).to.eq(symbol);
    expect(await this.token.decimals()).to.eq(18);
    expect(await this.token.owner()).to.eq(deployer.address);
  });

  it('mint', async () => {
    const [deployer, other] = await ethers.getSigners();
    expect(await this.token.name()).to.eq(name);
    expect(await this.token.symbol()).to.eq(symbol);
    expect(await this.token.decimals()).to.eq(18);

    await this.token.connect(deployer).mint(other.address, mintAmount);
    expect(await this.token.balanceOf(other.address)).to.be.eq(mintAmount);
  });

  it('mint:revert', async () => {
    const [_, other] = await ethers.getSigners();

    await expect(
      this.token.connect(other).mint(other.address, mintAmount),
    ).to.be.revertedWith('L2Token/no-ownership');
  });

  it('burn', async () => {
    const [deployer, other] = await ethers.getSigners();
    expect(await this.token.name()).to.eq(name);
    expect(await this.token.symbol()).to.eq(symbol);
    expect(await this.token.decimals()).to.eq(18);

    await this.token.connect(deployer).mint(other.address, mintAmount);

    await this.token.connect(deployer).burn(other.address, burnAmount);
    expect(await this.token.balanceOf(other.address)).to.be.eq(mintAmount - burnAmount);
  });

  it('burn:revert', async () => {
    const [deployer, other] = await ethers.getSigners();

    await this.token.connect(deployer).mint(other.address, mintAmount);

    await expect(
      this.token.connect(other).burn(other.address, burnAmount),
    ).to.be.revertedWith('L2Token/no-ownership');
  });
});
