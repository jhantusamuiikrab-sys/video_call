import { CallLog } from "../model/callLogs.js";
import { User } from "../model/user.js";

const callTimers = {};

async function startCallTimer(io, logId, callerId, receiverId, callType) {
  let CallerusedCallSeconds = 0;
  await User.findByIdAndUpdate(callerId, {
    $set: { ManualStopFlag: false },
  });
  callTimers[logId] = setInterval(async () => {
    let caller = await User.findById(callerId);
    // const receiver = await User.findById(receiverId);

    // const callerRemaining = caller.videoCallMinutes - caller.usedCallMinutes;
    // let callerRemaining = caller.videoCallMinutes - CallerusedCallSeconds;
    let callerRemaining =
      callType === "audio"
        ? caller.audioCallMinutes - CallerusedCallSeconds
        : caller.videoCallMinutes - CallerusedCallSeconds;
    // const receiverRemaining =
    //   receiver.videoCallMinutes - receiver.usedCallMinutes;
    if (caller.ManualStopFlag) //|| receiverRemaining <= 0
    {
      console.log("Manual call Ended.");
      // stop timer
      clearInterval(callTimers[logId]);
      delete callTimers[logId];
      // emit force end
      io.to(callerId.toString()).emit("call:forceEnd");
      io.to(receiverId.toString()).emit("call:forceEnd");
      return;
    }
    // if (callerRemaining <= 60 && callerRemaining > 0) {
    //   io.to(callerId.toString()).emit("call:lowBalance", {
    //     remaining: callerRemaining,
    //   });
    // }
    if (callerRemaining <= 0) //|| receiverRemaining <= 0
    {
      if (callType === "audio") {
        await User.findByIdAndUpdate(callerId, {
          $set: { audioCallMinutes: 0, ManualStopFlag: true },
        });
      } else {
        await User.findByIdAndUpdate(callerId, {
          $set: { videoCallMinutes: 0, ManualStopFlag: true },
        });
      }
      await CallLog.findByIdAndUpdate(logId, {
        callEnd: new Date(),
        totalTime: caller.videoCallMinutes, //CallerusedCallSeconds,
      });
      console.log("⛔ Minutes exhausted. Ending call.", CallerusedCallSeconds);

      // stop timer
      clearInterval(callTimers[logId]);
      delete callTimers[logId];

      // emit force end
      io.to(callerId.toString()).emit("call:forceEnd");
      io.to(receiverId.toString()).emit("call:forceEnd");
      return;
    }

    // increment used minutes every 60 sec
    // await User.findByIdAndUpdate(callerId, {
    //   $inc: { videoCallMinutes: -10 },
    // });
    CallerusedCallSeconds = CallerusedCallSeconds + 10;
    // caller = await User.findById(callerId);
    //receiver = await User.findById(receiverId);

    // const callerRemaining = caller.videoCallMinutes - caller.usedCallMinutes;
    // callerRemaining = caller.videoCallMinutes - CallerusedCallSeconds;
    // const receiverRemaining =
    //   receiver.videoCallMinutes - receiver.usedCallMinutes;

    // await User.findByIdAndUpdate(receiverId, {
    //   $inc: { usedCallMinutes: 1 },
    // });

    console.log("⏱ 10 second deducted");
  }, 10000); // every 1 minute
}

export { startCallTimer };
