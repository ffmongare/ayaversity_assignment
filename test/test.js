const { time, loadFixture, } = require("@nomicfoundation/hardhat-network-helpers");

// console.log(time);
// console.log(loadFixture);

// console.log(time.days);

const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
// console.log(anyValue);

const { expect } = require("chai");
const { ethers } = require("hardhat");

// console.log(expect);

describe("MyTest", function(){
  async function runEveryTime() {
    const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockedTime = (await time.latest()) + ONE_YEAR_IN_SECONDS;

    // console.log(ONE_YEAR_IN_SECONDS, ONE_GWEI);
    // console.log(unlockedTime);

    const [owner, otherAccount] = await ethers.getSigners();
    // console.log(owner);
    // console.log(otherAccount);

    const MyTest = await ethers.getContractFactory("MyTest");
    const myTest = await MyTest.deploy(unlockedTime, {value: lockedAmount});

    return { myTest, unlockedTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function(){
    //CHECKING UNLOCKED TIME
    it("Should check unlocked time", async function(){
      const { myTest, unlockedTime } = await loadFixture(runEveryTime);

      // console.log(unlockedTime);
      // console.log(myTest);

      expect(await myTest.unlockedTime()).to.equal(unlockedTime);
      // const ab = expect(await myTest.unlockedTime()).to.equal(unlockedTime);
      // console.log(ab);
    });

    //CHECKING OWNER
    it("Should set the right owner", async function(){
      const { myTest, owner } = await loadFixture(runEveryTime);

      expect(await myTest.owner()).to.equal(owner.address);
    });

    //CHECKING THE BALANCE
    it("Should receive and store the funds to MyTest", async function(){
      const { myTest, lockedAmount } = await loadFixture(runEveryTime);
      //console.log(lockedAmount);

      // const contractBal = await ethers.provider.getBalance(myTest.address);
      // console.log(contractBal.toNumber());

      expect(await ethers.provider.getBalance(myTest.address)).to.equal(lockedAmount);
    });

    //CONDITION CHECK
    it("Should fail if unlock is not in the future", async function(){
      const latestTime = await time.latest();

      const MyTest = await ethers.getContractFactory("MyTest");

       await expect(MyTest.deploy(latestTime, {value: 1})).to.be.revertedWith("Unlock Time should be in future");
    });
  });

  describe("Widthrawals", function(){
    describe("Validations", function(){
      //TIME CHECK FOR WITHDRAW
      it("Should revert with the right if called soon", async function(){
        const {myTest} = await loadFixture(runEveryTime);

        await expect(myTest.widthrawal()).to.be.revertedWith("Wait till the time period is completed");
      })

      it("Should revert the message for right owner", async function(){
        const {myTest, unlockedTime, otherAccount} = await loadFixture(runEveryTime);

        // const newTime = await time.increaseTo(unlockedTime);
        // console.log(newTime);
        await time.increaseTo(unlockedTime);

        await expect(myTest.connect(otherAccount).widthrawal()).to.be.revertedWith("You are not the owner");
      })

      it("Should not fail if the unlockedTime has arrived and the owner calls it", async function(){
        const {myTest, unlockedTime} = await loadFixture(runEveryTime);

        await time.increaseTo(unlockedTime);

        await expect(myTest.widthrawal()).to.be.revertedWith;
      })
    })
  });

  //NOW LETS CHECK FOR EVENTS
  describe("EVENTS", function(){
    it("Should emit the event on withdrawals", async function(){
      const { myTest, unlockedTime, lockedAmount } = await loadFixture(runEveryTime);

      await time.increaseTo(unlockedTime);

      await expect(myTest.widthrawal()).to.be.emit(myTest, "Widthrawal").withArgs(lockedAmount, anyValue);
    })
  });

  //CHECK FOR THE TRANSFER
  describe("Transfer", function(){
    it("Should transfer the funds to the owner", async function(){
      const { myTest, unlockedTime, lockedAmount, owner } = await loadFixture(runEveryTime);

      await time.increaseTo(unlockedTime);

      await expect(myTest.widthrawal()).to.changeEtherBalances([owner, myTest], [lockedAmount, -lockedAmount]);
    })
  });

  runEveryTime();
});