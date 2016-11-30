module.exports = {
    handle: function(message, bot) {
        var text = message.content.trim().toLowerCase();
        if (text != "~me") return;

        var userId = message.author.id;
        var player = bot.playerManager.getPlayer(userId);
        if (player === null) {
            message.reply("You haven't selected your character.");
            return;
        }

        if (typeof bot.freeMe[userId] === "undefined") bot.freeMe[userId] = 2;

        var employee = bot.createEmployeeFromPlayer(player);
        var goldToDeduct = employee.levelCached * 1000;
        if (message.channel.name === bot.dmmChannelName || message.channel.name === bot.nutakuChannelName) {
            goldToDeduct *= 2;
        }
        if (bot.isPM(message) || bot.freeMe[userId] > 0) goldToDeduct = 0;

        if (player.gold < goldToDeduct) {
            message.reply("You need to pay **" + goldToDeduct + " Gold** to use this command.");
            return;
        }

        var weaponModel = "02";
        if (player.equipedWeapon) {
            var weapon = bot.weaponDatabase.getWeaponById(player.equipedWeapon._id);
            weaponModel = weapon.modelId;    
        }
        
        var enemySpriteUrl = employee.getSpriteImageURL(employee.getRarity(), true, false, weaponModel);
        var enemySpriteFileName = "images/enemy/" + employee.getSpriteImageName(employee.getRarity(), false, weaponModel);

        var queue = [
            { fileToDownload: enemySpriteUrl,   fileToSave: enemySpriteFileName}
        ];
        var weaponFileName = null;
        if (player.equipedWeapon) {
            var weaponId = player.equipedWeapon._id;
            var plus = player.equipedWeapon.plus;
            var weaponIconUrl = bot.urlHelper.getEquipmentIconUrl(weaponId, plus, "small");
            weaponFileName = "images/equipment/small/" + weaponId + "0" + plus + "_1.png";
            queue.push({
                fileToDownload: weaponIconUrl,   fileToSave: weaponFileName
            })
        }
        var armorFileName = null;
        if (player.equipedArmor) {
            var armorId = player.equipedArmor._id;
            var plus = player.equipedArmor.plus;
            var armorIconUrl = bot.urlHelper.getEquipmentIconUrl(armorId, plus, "small");
            armorFileName = "images/equipment/small/" + armorId + "0" + plus + "_1.png";
            queue.push({
                fileToDownload: armorIconUrl,   fileToSave: armorFileName
            })
        }   
        
        bot.imageHelper.download(queue, function(err) {
            if (err) {
                message.reply("Error happened. Try again.");
                bot.log(err);
                return;
            }

            var itemCellFileName = "images/misc/itemCell.png";
            var backgroundFileName = "images/misc/background/" + bot.backgroundFileNames[bot.functionHelper.randomInt(bot.backgroundFileNames.length)];
            var shadowFileName = "images/misc/shadow.png";

            var fileNameQueue = [
                enemySpriteFileName, 
                itemCellFileName, 
                backgroundFileName, 
                shadowFileName
            ];

            if (weaponFileName) {
                fileNameQueue.push(weaponFileName);
            } else {
                fileNameQueue.push(null);
            }
            if (armorFileName) {
                fileNameQueue.push(armorFileName);
            } else {
                fileNameQueue.push(null);
            }
            bot.imageHelper.read(fileNameQueue, function (err, imageList) {
                if (err) {
                    message.reply("Error happened. Try again.");
                    bot.log(err); 
                    return;
                }
                enemySpriteImage = imageList[0];
                itemCellImage = imageList[1];
                backgroundImage = imageList[2];
                shadowImage = imageList[3];

                var weaponImage = imageList[4];
                var armorImage = imageList[5];

                backgroundImage.crop(250,100, 310,270);
                enemySpriteImage.crop(20, 0, 310, 270);

                shadowImage.scale(0.5);

                backgroundImage
                .composite(shadowImage, 105, 165)
                .composite(enemySpriteImage, 0, 0)
                .composite(itemCellImage, 10, 10)
                .composite(itemCellImage, 10, 60)
                .composite(itemCellImage, 10, 110);

                if (weaponImage) backgroundImage.composite(weaponImage, 10, 10);
                if (armorImage) backgroundImage.composite(armorImage, 10, 60);

                var imageName = "images/me/" + message.author.id + ".png";
                backgroundImage.write(imageName, function() {
                    var channel = message.channel;
                    if (channel.type === "text" || channel.type === "dm") {
                        
                        var emojiName = 'k' + employee.getClass().toLowerCase();
                        const classEmoji = (message.guild == null ? null : message.guild.emojis.find('name', emojiName));
                        const hpEmoji = (message.guild == null ? null : message.guild.emojis.find('name', 'khp'));
                        const atkEmoji = (message.guild == null ? null : message.guild.emojis.find('name', 'katk'));
                        const defEmoji = (message.guild == null ? null : message.guild.emojis.find('name', 'kdef'));
                        const matkEmoji = (message.guild == null ? null : message.guild.emojis.find('name', 'kmatk'));
                        const mdefEmoji = (message.guild == null ? null : message.guild.emojis.find('name', 'kmdef'));

                        if (player.gold < goldToDeduct) {
                            message.reply("You need to pay **" + goldToDeduct + " Gold** to use this command.");
                            return;
                        }
                        if (!bot.isPM(message) && bot.freeMe[userId] > 0) {
                            bot.freeMe[userId]--;
                        }
                        player.gold -= goldToDeduct;
                        bot.savePlayer();
                        
                        var text = "\n";
                        text += "Player: **" + message.author.username + "** (:moneybag:: **" + player.gold + "**)\n";
                        text += "Character: **" + employee.fullName + "** (Lv.**" + employee.levelCached  + "**)\n";
                        text += "Rarity: ";
                        for(var i=0;i<employee.getBaseRarity();i++) text += ":star:";
                        text += "\n";

                        text += "Class: **" + employee.getClass() + "** " + (classEmoji != null? classEmoji : "")  + "\n";
                        text += "Exp: **" + employee.exp + "** (Remain: **" + employee.getExpToNextLevel() + "pts**)\n";
                        text += (hpEmoji != null? hpEmoji + " " : "") + "HP: **" + employee.getHP() + "**\n";
                        text += (atkEmoji != null? atkEmoji + " " : "") + "Atk: **" + employee.getAtk() + "**\t";
                        text += (matkEmoji != null? matkEmoji + " " : "") + "M.Atk: **" + employee.getMAtk() + "**\n";
                        text += (defEmoji != null? defEmoji + " " : "") + "Def: **" + employee.getDef() + "**\t";
                        text += (mdefEmoji != null? mdefEmoji + " " : "") + "M.Def: **" + employee.getMDef() + "**\n";
                        text += "CRIT: **" + employee.getCrit() + "**\tHIT: **" + employee.getHit() + "**\tEVA: **" + employee.getEva() + "**\n";
                        text += "\n======SKILLS======\n";
                        text += "Front Skill: " + employee.getFrontSkill() + "\n";                    
                        text += "Back Skill: " + employee.getBackSkill() + "\n";

                        if (bot.isPM(message)) {
                            text += "\n====BASE STATS====\n";
                            text += "**STR: " + employee.getSTR() + "**\t\t";
                            text += "**INT: " + employee.getINT() + "**\n";
                            text += "**VIT: " + employee.getVIT() + "**\t\t";
                            text += "**PIE: " + employee.getPIE() + "**\n";
                            text += "**AGI: " + employee.getAGI() + "**\t\t";
                            text += "**LUK: " + employee.getLUK() + "**\n";
                            text += "**DEX: " + employee.getDEX() + "**\n";
                        }
                        channel.sendFile(imageName, "png", text);
                    }
                });
            });
        });
    }
}