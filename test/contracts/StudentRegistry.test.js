/**
 * StudentRegistryContract Tests
 * Comprehensive test suite for student registration and verification
 */

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('StudentRegistryContract', function () {
    let studentRegistry, privacyContract;
    let owner, student1, student2, verifier;
    const VERIFICATION_FEE = ethers.parseEther('60');

    beforeEach(async function () {
        [owner, student1, student2, verifier] = await ethers.getSigners();

        // Deploy PrivacyContract
        const PrivacyContract = await ethers.getContractFactory('PrivacyContract');
        privacyContract = await PrivacyContract.deploy();
        await privacyContract.waitForDeployment();

        // Deploy StudentRegistryContract
        const StudentRegistry = await ethers.getContractFactory('StudentRegistryContract');
        studentRegistry = await StudentRegistry.deploy(await privacyContract.getAddress());
        await studentRegistry.waitForDeployment();

        // Grant verifier role
        await studentRegistry.grantVerifierRole(verifier.address);
    });

    describe('Student Registration', function () {
        it('Should allow student registration with correct fee', async function () {
            const identityHash = ethers.id('student1_identity');

            await expect(
                studentRegistry.connect(student1).registerStudent(identityHash, {
                    value: VERIFICATION_FEE,
                })
            )
                .to.emit(studentRegistry, 'StudentRegistered')
                .withArgs(student1.address, identityHash);

            const profile = await studentRegistry.getStudentProfile(student1.address);
            expect(profile.status).to.equal(0); // Pending
        });

        it('Should reject registration with insufficient fee', async function () {
            const identityHash = ethers.id('student1_identity');
            const insufficientFee = ethers.parseEther('50');

            await expect(
                studentRegistry.connect(student1).registerStudent(identityHash, {
                    value: insufficientFee,
                })
            ).to.be.revertedWith('Incorrect verification fee');
        });

        it('Should prevent duplicate registration', async function () {
            const identityHash = ethers.id('student1_identity');

            await studentRegistry.connect(student1).registerStudent(identityHash, {
                value: VERIFICATION_FEE,
            });

            await expect(
                studentRegistry.connect(student1).registerStudent(identityHash, {
                    value: VERIFICATION_FEE,
                })
            ).to.be.revertedWith('Already registered');
        });
    });

    describe('Student Verification', function () {
        beforeEach(async function () {
            const identityHash = ethers.id('student1_identity');
            await studentRegistry.connect(student1).registerStudent(identityHash, {
                value: VERIFICATION_FEE,
            });
        });

        it('Should allow verifier to approve student', async function () {
            await expect(studentRegistry.connect(verifier).verifyStudent(student1.address))
                .to.emit(studentRegistry, 'StudentVerified')
                .withArgs(student1.address);

            const profile = await studentRegistry.getStudentProfile(student1.address);
            expect(profile.status).to.equal(1); // Verified

            const isVerified = await studentRegistry.isVerifiedStudent(student1.address);
            expect(isVerified).to.be.true;
        });

        it('Should allow verifier to reject student', async function () {
            const reason = 'Invalid documents';

            await expect(
                studentRegistry.connect(verifier).rejectStudent(student1.address, reason)
            )
                .to.emit(studentRegistry, 'StudentRejected')
                .withArgs(student1.address, reason);

            const profile = await studentRegistry.getStudentProfile(student1.address);
            expect(profile.status).to.equal(3); // Rejected
        });

        it('Should prevent non-verifier from verifying', async function () {
            await expect(
                studentRegistry.connect(student2).verifyStudent(student1.address)
            ).to.be.reverted;
        });
    });

    describe('Fee Management', function () {
        it('Should track total fees collected', async function () {
            const identityHash1 = ethers.id('student1_identity');
            const identityHash2 = ethers.id('student2_identity');

            await studentRegistry.connect(student1).registerStudent(identityHash1, {
                value: VERIFICATION_FEE,
            });

            await studentRegistry.connect(student2).registerStudent(identityHash2, {
                value: VERIFICATION_FEE,
            });

            const totalFees = await studentRegistry.totalFeesCollected();
            expect(totalFees).to.equal(VERIFICATION_FEE * 2n);
        });

        it('Should allow admin to withdraw fees', async function () {
            const identityHash = ethers.id('student1_identity');
            await studentRegistry.connect(student1).registerStudent(identityHash, {
                value: VERIFICATION_FEE,
            });

            const initialBalance = await ethers.provider.getBalance(owner.address);

            const tx = await studentRegistry.withdrawFees();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalBalance = await ethers.provider.getBalance(owner.address);
            expect(finalBalance).to.be.closeTo(
                initialBalance + VERIFICATION_FEE - gasUsed,
                ethers.parseEther('0.01')
            );
        });
    });

    describe('Statistics', function () {
        it('Should track registration statistics', async function () {
            const identityHash1 = ethers.id('student1_identity');
            const identityHash2 = ethers.id('student2_identity');

            await studentRegistry.connect(student1).registerStudent(identityHash1, {
                value: VERIFICATION_FEE,
            });

            await studentRegistry.connect(student2).registerStudent(identityHash2, {
                value: VERIFICATION_FEE,
            });

            await studentRegistry.connect(verifier).verifyStudent(student1.address);

            const stats = await studentRegistry.getRegistrationStats();
            expect(stats.totalStudents).to.equal(2);
            expect(stats.verifiedStudents).to.equal(1);
            expect(stats.pendingVerifications).to.equal(1);
        });
    });
});
