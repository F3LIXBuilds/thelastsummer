EPISODE: ep1 | Welcome Back to Lagos
START: arrival

SCENE: arrival
MUSIC: lagos_evening
BACKGROUND: obalende_busstop
FADE: clear
SFX: horn
NARRATE: Obalende, 6:47 p.m. The danfo hisses to a stop and Lagos hits you all at once: horns, plantain smoke, a conductor chanting destinations like a prayer.
NARRATE: Four years abroad. Nine days since Grandma Abeni was buried without you.
SHOW: player left nervous
SHOW: adaeze right happy from right
adaeze (happy): {name}!! Oya, come here! Four years and you still stand like somebody waiting for permission.
CHOICE greeting: Adaeze is already running toward you.
* hug: Drop your bag and hug her tight.
    summary: You hugged Adaeze like no time had passed.
    effects: adaeze.friendship +8, adaeze.romance +2
    then:
        EXPRESSION: player happy
        adaeze (embarrassed): Okay, okay! People are looking. This is Obalende, not a Nollywood airport scene.

* tease: "You're late. Typical."
    summary: You teased Adaeze the moment you saw her.
    effects: adaeze.friendship +3, adaeze.romance +4
    then:
        player (confident): You're late. Typical.
        adaeze (confident): Late? I have been here since the last time you ignored my calls. Carry your bag.

* cold: Glance at your phone. Barely look up.
    summary: You barely looked up when Adaeze came to meet you.
    effects: adaeze.friendship -5, adaeze.trust -2
    then:
        adaeze (sad): Ah. So this is how it is.
        NARRATE: She takes your bag anyway. That's the worst part.

ENDCHOICE
GOTO: suya

SCENE: suya
FADE: black 700
HIDE: adaeze
HIDE: player
BACKGROUND: suya_spot
FADE: clear
SHOW: player left happy
SHOW: adaeze center happy
NARRATE: Mama Kudi's suya spot, off Awolowo Road. Same plastic stools. Same smoke. Same pepper that makes your eyes remember everything.
adaeze: Two portions, Mama! Extra yaji! My friend has been eating foreign suya. That one is not suya, that is barbecue with an identity crisis.
player (happy): I missed this. All of it. Even the pepper wahala.
adaeze (nervous): {name}... before we eat. It's about Grandma's house.
adaeze (sad): Surveyors keep coming. Men with clipboards. And last week, somebody cut the padlock off the boat house.
SFX: car
CAMERA: shake
SHOW: tunde right confident from right
tunde: {name}. Welcome home. I'm sorry about Grandma Abeni. Truly.
adaeze (angry): Tunde. Not tonight.
tunde (neutral): I came with respect. My father wants to make your family an offer for the property. A fair one. More than fair.
NARRATE: He slides a cream envelope across the table, right beside the suya.
CHOICE offer: Everyone is watching you.
* take: Take the envelope. Hear him out.
    summary: You took the Bakare family's envelope.
    effects: give bakare_offer, flag tookOffer, tunde.trust +3, adaeze.trust -8
    then:
        player (nervous): Leave it with me. I'll read it.
        adaeze (sad): ...Okay.

* refuse: Push it back. "The house isn't for sale."
    summary: You refused Tunde's offer on the spot.
    effects: flag refusedOffer, courage +5, tunde.rivalry +10, adaeze.trust +6
    then:
        player (angry): The house isn't for sale. Not to you, not to your father.
        tunde (surprised): You haven't even read it.

* question: "Why is your father so desperate?"
    summary: You wondered aloud why the Bakares want the house so badly.
    effects: flag suspectsBakare, tunde.rivalry +4
    then:
        player (confident): Why is your father suddenly so desperate for a house nobody wanted last year?
        tunde (nervous): Desperate? Nobody said desperate.

* together: Let Adaeze stand with you.
    summary: Adaeze stood beside you against Tunde.
    effects: adaeze.trust +6, adaeze.romance +3, tunde.rivalry +6
    requires: adaeze.friendship >= 25
    locked: You and Adaeze aren't close enough for this yet.
    then:
        MOVE: adaeze left
        NARRATE: Adaeze shifts her stool beside yours, shoulder to shoulder. She doesn't say a word. She doesn't need to.
        tunde (neutral): Two against one. Fine.

ENDCHOICE
tunde (confident): Think it over. The offer expires at the end of the month.
HIDE: tunde to right
GOTO: beach_house

SCENE: beach_house
FADE: black 800
HIDE: adaeze
HIDE: player
MUSIC: waves_night
BACKGROUND: beach_house_night
FADE: clear
NARRATE: The old house sits where the Lekki road gives up and turns into sand. NEPA has taken the light, as usual. A single lantern swings at the gate.
SHOW: player left nervous
SHOW: sade center
sade: So you came. Eh-heh. I wasn't sure you would.
sade (sad): She left something for you, {name}. Only you. Not your father. Not Uncle Femi. Nobody.
NARRATE: Sade holds out a brass key, green with age, and a letter folded small.
CHOICE key_choice: Grandma Abeni's last wish is in Sade's hands.
* take_key: Take the key and the letter.
    summary: You accepted Grandma Abeni's key.
    effects: give mysterious_key, give grandma_letter, flag hasKey
    then:
        SFX: door
        NARRATE: The key is heavier than it looks.

* letter_only: Take the letter only. "I'm not ready for the key."
    summary: You left Grandma's key with Sade, for now.
    effects: give grandma_letter, flag leftKey, sade.trust +3, courage -2
    then:
        player (nervous): Keep the key a little longer, Sade. I'm not ready.
        sade (sad): She said you would say that.

ENDCHOICE
CHOICE read_letter: The letter trembles in your hand.
* read_now: Read it now, by lantern light.
    summary: You read Grandma Abeni's letter right away.
    effects: flag knowsSecret, courage +3
    then:
        NARRATE: "My dear one. If you are reading this, the house still stands, and so do you."
        NARRATE: "Do not sell. What your grandfather and old Chief Bakare buried behind the boat house in 1989 is not theirs to sell, and it is not yours to forget."
        NARRATE: "Tell no Bakare. Trust Adaeze. — Abeni"
        sade (nervous): Whatever it says... I only carried it, okay?

* read_later: Fold it away. Some truths can wait one more night.
    summary: You decided to save the letter for later.
    effects: flag unreadLetter
    then:
        NARRATE: You slide the letter into your pocket. It feels like it's burning.

ENDCHOICE
GOTO: invite_intro

SCENE: invite_intro
FADE: black 800
HIDE: sade
HIDE: player
MUSIC: quiet
BACKGROUND: beach_house_morning
FADE: clear
NARRATE: Morning. Generator noise, sea breeze, and somebody banging on the gate like a debt collector.
SHOW: player left
SHOW: zainab right happy from right
zainab: Is this the famous {name}? I'm Zainab! I do events, music, and wahala. In that order.
zainab (confident): Tonight: Sunset Sessions on the beach. Amapiano, jollof, a generator that has never failed me. And you, my dear, will be there.
GOTO: invite_choice

SCENE: invite_choice
CHOICE invite: Zainab is not leaving without an answer.
* accept: "I'm in."
    summary: You said yes to Zainab's beach party.
    effects: flag goingParty, zainab.friendship +6
    goto: party
    then:
        player (happy): I'm in.
        zainab (happy): Beautiful! Wear something you can sweat in.

* refuse_party: "I'm here to grieve, not to party."
    summary: You turned down the party.
    effects: flag skippedParty, zainab.friendship -3
    goto: quiet_night
    then:
        player (sad): I'm here to grieve, not to party.
        zainab (sad): I understand. But the sea doesn't judge. If you change your mind.

* ask_guests: "Who else is going?"
    effects: flag knowsGuestList, zainab.trust +3
    requires: not knowsGuestList
    hidden
    goto: invite_choice
    then:
        player (confident): Who else is going?
        zainab (nervous): Everyone. Adaeze. Tunde and his people. And a few faces you won't expect.

ENDCHOICE

SCENE: party
FADE: black 700
HIDE: zainab
HIDE: player
MUSIC: party
BACKGROUND: beach_party
FADE: clear
NARRATE: By sunset the beach has become a different country. Log drums, fairy lights, and the whole of Lekki pretending it has no problems.
SHOW: player left happy
SHOW: zainab center happy
zainab: Welcome to the only place in Lagos that never loses light. We have generator!
SHOW: adaeze right happy from right
adaeze (happy): I told everyone you'd refuse that envelope. Zainab owes me five thousand naira. @if refusedOffer
adaeze (nervous): So... you took the envelope. I'm not judging. I'm just... noticing. @if tookOffer
adaeze (happy): You came! I was starting to think the sea swallowed you. @if not refusedOffer and not tookOffer
CHOICE party_moment: The night is yours.
* dance: Dance with Adaeze
    summary: You danced with Adaeze under the fairy lights.
    effects: adaeze.romance +8, adaeze.friendship +2
    premium
    then:
        player (confident): Dance with me?
        adaeze (embarrassed): Ah! Okay, okay. But if you step on my foot, we are no longer friends.
        NARRATE: For three songs, the whole city disappears.

* help_dj: Help Zainab when the speakers cut out
    summary: You saved Zainab's set when the speakers died.
    effects: reputation +5, zainab.friendship +5
    then:
        SFX: door
        NARRATE: The music dies mid-beat. You find a loose cable behind the speaker stack and push it back in. The crowd roars.
        zainab (surprised): You? On my equipment? ...Okay. You can stay.

* shore: Slip away to the shoreline
    summary: You noticed a torch moving inside the boat house.
    effects: flag sawTorchlight, courage +2
    then:
        NARRATE: Past the lights, the sea is quiet. Down the beach, the boat house stands dark, except for a thin torch beam sliding behind its window.

ENDCHOICE
GOTO: party_tunde

SCENE: party_tunde
HIDE: zainab
MUSIC: tense
NARRATE: The music dips for half a second, the way it does when somebody important walks in.
SHOW: tunde center confident from right
CAMERA: zoom 1.15
tunde: A word, {name}. Alone.
adaeze (angry): Anything you say to {name}, you say in front of me. @if adaeze.trust >= 20
adaeze (nervous): I'll... be over there. @if adaeze.trust < 20
CHOICE tunde_talk: Tunde is waiting.
* follow: Follow Tunde to the dock.
    summary: You heard Tunde out in private.
    effects: tunde.trust +4, adaeze.trust -4, flag followedTunde
    then:
        tunde (confident): Smart. My father respects people who listen.
        NARRATE: On the dock, Tunde triples the price. You can almost hear your grandmother laughing in the waves.

* in_front: "Say it in front of Adaeze."
    summary: You refused to talk behind Adaeze's back.
    effects: adaeze.trust +8, tunde.rivalry +5
    then:
        player (confident): Whatever you want to say, say it in front of Adaeze.
        tunde (angry): ...Fine. Another day.

* secret: "What did our grandfathers bury, Tunde?"
    summary: You confronted Tunde about the secret behind the boat house.
    effects: flag confrontedTunde, courage +5, tunde.rivalry +10, tunde.trust -5, adaeze.trust +3
    requires: knowsSecret
    hidden
    then:
        player (angry): What did our grandfathers bury behind that boat house, Tunde?
        CAMERA: shake
        tunde (surprised): Who told you— 
        adaeze (surprised): Buried? Buried what?

ENDCHOICE
CAMERA: reset
HIDE: tunde to right
GOTO: party_end

SCENE: party_end
MUSIC: waves_night
NARRATE: Later, when the speakers finally rest, Adaeze walks you down the sand.
NARRATE: Adaeze trusts you. It shows in the way she lets her shoulder touch yours. @if adaeze.trust >= 20
adaeze (happy): Whatever Grandma left you, whatever Tunde wants, you're not doing it alone. You hear me? @if adaeze.trust >= 20
NARRATE: Adaeze keeps her distance. The sand between you feels wider than the sea. @if adaeze.trust < 20
adaeze (sad): I don't know if I know you anymore, {name}. @if adaeze.trust < 20
GOTO: boathouse

SCENE: quiet_night
FADE: black 800
HIDE: zainab
MUSIC: quiet
BACKGROUND: beach_house_night
FADE: clear
NARRATE: You stay in. The sea is loud tonight. So is the silence.
SHOW: sade center
sade: You didn't go to the party. Good. Sit. Let me tell you what Grandma never told your father.
sade (sad): Chief Bakare's father owed Grandma Abeni his life. She kept quiet for thirty years. Now the son wants the land.
sade (nervous): Something is buried behind the boat house. I don't know what. I only know she checked that door every Sunday.
EFFECT: flag knowsSecret
SFX: door
SHOW: adaeze right happy from right
adaeze (happy): You didn't come to the party, so the party came to you.
NARRATE: She is carrying a foil pack of party jollof and two plastic spoons. You eat on the steps, laughing for the first time since you landed.
EFFECT: adaeze.friendship +5, adaeze.trust +8
adaeze (surprised): Wait. Is that a torch at the boat house?
GOTO: boathouse

SCENE: boathouse
FADE: black 800
HIDE: sade
HIDE: tunde
HIDE: zainab
MUSIC: tense
BACKGROUND: boathouse_exterior
FADE: clear
NARRATE: The boat house leans over the water like it's listening. The padlock is gone. Only the blue door remains: paint peeling, salt-bitten, patient.
SHOW: player left nervous
SHOW: adaeze right nervous
NARRATE: Hands shaking, you finally unfold Grandma's letter by torchlight. Do not sell. Tell no Bakare. Trust Adaeze. @if unreadLetter
EFFECT: flag knowsSecret, adaeze.trust +3 @if unreadLetter
adaeze (nervous): So this is it? Whatever she was protecting?
GOTO: ending_together @if has mysterious_key and adaeze.trust >= 20
GOTO: ending_alone @if has mysterious_key
GOTO: ending_locked

SCENE: ending_together
NARRATE: The key turns on the second try. The door breathes out thirty years of stale air.
SFX: door
BACKGROUND: boathouse_inside
MUSIC: quiet
NARRATE: Inside: a rusted tin trunk. A ledger. Photographs. And one picture on top that makes Adaeze stop breathing.
EFFECT: give old_photograph, flag sawPhoto
adaeze (surprised): That's my mother. With your grandmother. And old Chief Bakare. Why is my mother in this photo?
NARRATE: On the back, in Grandma Abeni's careful hand: "The three who kept the secret. Only two are left."
player (nervous): Adaeze... who's the third?
SFX: car
CAMERA: flash
NARRATE: Headlights sweep across the water. A car door slams. Someone is walking toward the boat house, unhurried, like he owns the place.
END: Episode 1 Complete | You opened the door together. Whatever comes next, you won't face it alone.

SCENE: ending_alone
adaeze (sad): I'll... stand guard out here. It's your family's secret, not mine.
HIDE: adaeze
NARRATE: The key turns. The door opens on darkness, salt, and the smell of old paper.
SFX: door
BACKGROUND: boathouse_inside
MUSIC: quiet
NARRATE: A tin trunk. A ledger. A photograph of three people: Grandma Abeni, Chief Bakare's father, and a woman whose face you almost recognize.
EFFECT: give old_photograph
SFX: horn
NARRATE: Your phone buzzes. An unknown number. One message: "Leave it. And don't trust her."
END: Episode 1 Complete | You opened the door alone. Now you wonder who was really standing behind it.

SCENE: ending_locked
NARRATE: The padlock is gone, but there's a second lock beneath it. Brass. Old. And you don't have the key.
adaeze (sad): Maybe Sade still has it. We should go back.
SFX: car
CAMERA: flash
SHOW: tunde center confident from right
tunde: Thank you for bringing us here, {name}. Some doors only open when the family is standing in front of them.
NARRATE: Two men with a locksmith's bag step out of the dark behind him.
END: Episode 1 Complete | Tunde got there first. The blue door won't stay closed for long.
