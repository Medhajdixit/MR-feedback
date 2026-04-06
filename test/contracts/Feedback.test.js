/**
 * FeedbackContract Tests
 * Test suite for feedback submission and voting
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('FeedbackContract', function () {
    let feedbackContract, studentRegistry, aiModeration, pointEconomy;
    let owner, student1, student2;

    beforeEach(async function () {
        [owner, student1, student2] = await ethers.getSigners();

        // Deploy dependencies
        const PrivacyContract = await ethers.getContractFactory('PrivacyContract');
        const privacyContract = await PrivacyContract.deploy();

        const StudentRegistry = await ethers.getContractFactory('StudentRegistryContract');
        studentRegistry = await StudentRegistry.deploy(await privacyContract.getAddress());

        const AIModeration = await ethers.getContractFactory('AIModerationContract');
        aiModeration = await AIModeration.deploy(await studentRegistry.getAddress());

        const PointEconomy = await ethers.getContractFactory('PointEconomyContract');
        pointEconomy = await PointEconomy.deploy(await studentRegistry.getAddress());

        // Deploy FeedbackContract
        const FeedbackContract = await ethers.getContractFactory('FeedbackContract');
        feedbackContract = await FeedbackContract.deploy(
            await studentRegistry.getAddress(),
            await aiModeration.getAddress(),
            await pointEconomy.getAddress()
        );

        // Register and verify students
        const fee = ethers.parseEther('60');
        await studentRegistry.connect(student1).registerStudent(ethers.id('student1'), { value: fee });
        await studentRegistry.connect(student2).registerStudent(ethers.id('student2'), { value: fee });
        await studentRegistry.verifyStudent(student1.address);
        await studentRegistry.verifyStudent(student2.address);

        // Grant roles
        await pointEconomy.grantRewardManagerRole(await feedbackContract.getAddress());
    });

    describe('Feedback Submission', function () {
        it('Should allow verified student to submit feedback', async function () {
            const category = 0; // General
            const contentHash = ethers.id('feedback_content');
            const imageHash = ethers.ZeroHash;
            const aiQualityScore = 85;
            const isAnonymous = false;

            await expect(
                feedbackContract
                    .connect(student1)
                    .submitFeedback(category, contentHash, imageHash, aiQualityScore, isAnonymous)
            )
                .to.emit(feedbackContract, 'FeedbackSubmitted')
                .withArgs(1, student1.address, category, isAnonymous, aiQualityScore);

            const feedback = await feedbackContract.getFeedback(1);
            expect(feedback.author).to.equal(student1.address);
            expect(feedback.category).to.equal(category);
            expect(feedback.contentHash).to.equal(contentHash);
        });

        it('Should prevent unverified student from submitting', async function () {
            const [unverified] = await ethers.getSigners();

            await expect(
                feedbackContract
                    .connect(unverified)
                    .submitFeedback(0, ethers.id('content'), ethers.ZeroHash, 85, false)
            ).to.be.revertedWith('Not verified student');
        });

        it('Should increment feedback counter', async function () {
            await feedbackContract
                .connect(student1)
                .submitFeedback(0, ethers.id('content1'), ethers.ZeroHash, 85, false);

            await feedbackContract
                .connect(student2)
                .submitFeedback(1, ethers.id('content2'), ethers.ZeroHash, 90, false);

            const count = await feedbackContract.feedbackCounter();
            expect(count).to.equal(2);
        });
    });

    describe('Voting', function () {
        beforeEach(async function () {
            await feedbackContract
                .connect(student1)
                .submitFeedback(0, ethers.id('content'), ethers.ZeroHash, 85, false);
        });

        it('Should allow upvoting feedback', async function () {
            await expect(feedbackContract.connect(student2).voteFeedback(1, true))
                .to.emit(feedbackContract, 'FeedbackVoted')
                .withArgs(1, student2.address, true);

            const feedback = await feedbackContract.getFeedback(1);
            expect(feedback.upvotes).to.equal(1);
        });

        it('Should allow downvoting feedback', async function () {
            await feedbackContract.connect(student2).voteFeedback(1, false);

            const feedback = await feedbackContract.getFeedback(1);
            expect(feedback.downvotes).to.equal(1);
        });

        it('Should prevent double voting', async function () {
            await feedbackContract.connect(student2).voteFeedback(1, true);

            await expect(
                feedbackContract.connect(student2).voteFeedback(1, true)
            ).to.be.revertedWith('Already voted');
        });

        it('Should prevent author from voting own feedback', async function () {
            await expect(
                feedbackContract.connect(student1).voteFeedback(1, true)
            ).to.be.revertedWith('Cannot vote own feedback');
        });
    });

    describe('Category Statistics', function () {
        it('Should track feedbacks by category', async function () {
            await feedbackContract
                .connect(student1)
                .submitFeedback(0, ethers.id('content1'), ethers.ZeroHash, 85, false);

            await feedbackContract
                .connect(student2)
                .submitFeedback(0, ethers.id('content2'), ethers.ZeroHash, 90, false);

            const count = await feedbackContract.getCategoryCount(0);
            expect(count).to.equal(2);
        });
    });
});
