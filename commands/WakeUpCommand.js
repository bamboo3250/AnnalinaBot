module.exports = {
    handle: function(message, bot) {
        var command = bot.functionHelper.parseCommand(message);
        if (command.commandName != "~wakeup") return;
        var userId = message.author.id;
        if (!bot.aromaEffect) {
            message.reply("You aren't under the effect of Aroma Oil.");
            return;
        }
        if (!bot.aromaEffect.contributors[userId]) {
            message.reply("You haven't contributed any Aroma Oil yet.");
            return;   
        }

        var elapsedTime = bot.aromaEffect.endTime - bot.aromaEffect.contributors[userId].startTime;
        var numItemsWillGet = Math.floor(elapsedTime/(60*1000));
        numItemsWillGet = Math.min(numItemsWillGet, bot.aromaEffect.contributors[userId].amount * 20);
        var contributorUser = bot.userManager.getUser(userId);

        var numReceivedItem = 0;
        var receivedItems = {};
        while(numReceivedItem < numItemsWillGet) {
            var itemNameWillGet = bot.functionHelper.randomObject(aromaRewardList);
            if (typeof receivedItems[itemNameWillGet] === "undefined") receivedItems[itemNameWillGet] = 0;
            if (!aromaLimitReward[itemNameWillGet] || receivedItems[itemNameWillGet] < aromaLimitReward[itemNameWillGet]) {
                receivedItems[itemNameWillGet]++;
                numReceivedItem++;    
            }
        }
        var text = "Oh! You woke up? You just received some presents while sleeping.\n";
        for(key in receivedItems) {
            var itemName = key;
            text += itemName + " x" + receivedItems[itemName] + "\n";
            bot.playerManager.addItem(userId, itemName, receivedItems[itemName]);
        }
        contributorUser.sendMessage(text);
        delete bot.aromaEffect.contributors[userId];
        bot.savePlayer();
        bot.saveAroma();
        var member = bot.userManager.getMember(userId);
        var aromaRole = member.guild.roles.find('name', 'Aroma Room');
        member.removeRole(aromaRole).then(output => {
            bot.log("Aroma Role is removed for " + member.user.username);
        }).catch(err => {
            bot.log("[removeAromaRole]" + err);
        });
    }
}