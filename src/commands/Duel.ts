import { Command } from "@jiman24/commandment";
import { Message } from "discord.js";
import { Player } from "../structure/Player";
import { currency, validateAmount, validateNumber } from "../utils";
import { Battle } from "discordjs-rpg";
import { ButtonConfirmation } from "../structure/ButtonHandler";
import { oneLine } from "common-tags";

export default class extends Command {
  name = "duel";
  description = "duel with other person with betting";
  maxCount = 5;
  cooldownTime = 1; // hours

  async exec(msg: Message, args: string[]) {

    const player = Player.fromUser(msg.author);
    const arg1 = args[1];
    const amount = parseInt(arg1);

    if (!arg1) {
      throw new Error("please specify an amount to bet");
    }

    validateNumber(amount);
    validateAmount(amount, player.shards);

    const mentionedUser = msg.mentions.users.first();

    if (!mentionedUser) {
      throw new Error(`You need to mention a user`);
    }

    const duelConfirmation = new ButtonConfirmation(
      msg, 
      oneLine`${player.name} challenge into a duel for ${amount} ${currency}.
      Do you accept? ${mentionedUser}`,
      mentionedUser.id,
    );

    const accept = await duelConfirmation.confirm();

    if (!accept) {
      throw new Error(`${mentionedUser.username} rejected the duel challenge`);
    }

    const opponent = Player.fromUser(mentionedUser);

    if (opponent.shards < amount) {
      throw new Error(`${opponent.name} has insufficient balance`);
    }

    opponent.shards -= amount;
    player.shards -= amount;

    const battle = new Battle(msg, [player, opponent]);
    const winner = (await battle.run()) as Player;
    const loser = player.id === winner.id ? opponent : player;

    winner.shards += amount * 2;

    winner.save();
    loser.save();

    msg.channel.send(`${winner.name} wins over ${opponent.name}!`);
    msg.channel.send(`${winner.name} earns ${amount * 2} ${currency}`);
    msg.channel.send(`${loser.name} loses ${amount} ${currency}`);

  }
}