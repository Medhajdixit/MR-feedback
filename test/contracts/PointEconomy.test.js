/**
 * PointEconomyContract Tests
 * Test suite for point system and rewards
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PointEconomyContract', function () {
    let pointEconomy, studentRegistry;
    let owner, student1, rewardManager;

    beforeEach(async function () {
        [owner, student1, rewardManager] = await ethers.getSigners();

        // Deploy dependencies
        const PrivacyContract = await ethers.getContractFactory('PrivacyContract');
        const privacyContract = await PrivacyContract.deploy();

        const StudentRegistry = await ethers.getContractFactory('StudentRegistryContract');
        studentRegistry = await StudentRegistry.deploy(await privacyContract.getAddress());

        // Deploy PointEconomyContract
        const PointEconomy = await ethers.getContractFactory('PointEconomyContract');
        pointEconomy = await PointEconomy.deploy(await studentRegistry.getAddress());

        // Register and verify student
        const fee = ethers.parseEther('60');
        await studentRegistry.connect(student1).registerStudent(ethers.id('student1'), { value: fee });
        await studentRegistry.verifyStudent(student1.address);

        // Grant reward manager role
        await pointEconomy.grantRewardManagerRole(rewardManager.address);
    });

    describe('Point Awarding', function () {
        it('Should award points for activity', async function () {
            const activity = 0; // BasicFeedback
            const qualityScore = 85;
            const description = 'Test feedback';

            await expect(
                pointEconomy.connect(rewardManager).awardPoints(student1.address, activity, qualityScore, description)
            ).to.emit(pointEconomy, 'PointsAwarded');

            const balance = await pointEconomy.getPointBalance(student1.address);
            expect(balance).to.be.gt(0);
        });

        it('Should calculate quality bonus correctly', async function () {
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 90, 'High quality');

            const balance = await pointEconomy.getPointBalance(student1.address);
            // Base points + quality bonus
            expect(balance).to.be.gte(100);
        });

        it('Should prevent non-reward-manager from awarding points', async function () {
            await expect(
                pointEconomy.connect(student1).awardPoints(student1.address, 0, 85, 'Test')
            ).to.be.reverted;
        });
    });

    describe('Point Transfer', function () {
        beforeEach(async function () {
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 85, 'Initial points');
        });

        it('Should allow point transfer between users', async function () {
            const [, , student2] = await ethers.getSigners();
            const fee = ethers.parseEther('60');
            await studentRegistry.connect(student2).registerStudent(ethers.id('student2'), { value: fee });
            await studentRegistry.verifyStudent(student2.address);

            const transferAmount = 50;
            const initialBalance = await pointEconomy.getPointBalance(student1.address);

            await pointEconomy.connect(student1).transferPoints(student2.address, transferAmount);

            const finalBalance = await pointEconomy.getPointBalance(student1.address);
            const recipientBalance = await pointEconomy.getPointBalance(student2.address);

            expect(finalBalance).to.equal(initialBalance - BigInt(transferAmount));
            expect(recipientBalance).to.equal(transferAmount);
        });

        it('Should prevent transfer with insufficient balance', async function () {
            const [, , student2] = await ethers.getSigners();
            const balance = await pointEconomy.getPointBalance(student1.address);

            await expect(
                pointEconomy.connect(student1).transferPoints(student2.address, balance + 1n)
            ).to.be.revertedWith('Insufficient points');
        });
    });

    describe('Point Redemption', function () {
        beforeEach(async function () {
            // Award enough points for redemption (1000 points = 1 SHM)
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 85, 'Points for redemption');
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 85, 'More points');
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 85, 'Even more');

            // Fund contract with SHM
            await owner.sendTransaction({
                to: await pointEconomy.getAddress(),
                value: ethers.parseEther('10'),
            });
        });

        it('Should allow redeeming points for SHM', async function () {
            const pointsToRedeem = 1000;
            const initialBalance = await ethers.provider.getBalance(student1.address);

            const tx = await pointEconomy.connect(student1).redeemPoints(pointsToRedeem);
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalance = await ethers.provider.getBalance(student1.address);
            const expectedSHM = ethers.parseEther('1'); // 1000 points = 1 SHM

            expect(finalBalance).to.be.closeTo(
                initialBalance + expectedSHM - gasUsed,
                ethers.parseEther('0.01')
            );
        });
    });

    describe('Statistics', function () {
        it('Should track total points awarded', async function () {
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 0, 85, 'Test 1');
            await pointEconomy.connect(rewardManager).awardPoints(student1.address, 1, 90, 'Test 2');

            const stats = await pointEconomy.getPointStats();
            expect(stats.totalPointsAwarded).to.be.gt(0);
        });
    });
});
