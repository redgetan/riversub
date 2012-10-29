# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

lyrics_1 = <<EOF
[Intro - Rihanna:]
Just gonna stand there and watch me burn
But that's alright because I like the way it hurts
Just gonna stand there and hear me cry
But that's alright because I love the way you lie
I love the way you lie

[Verse - Eminem:]
I can't tell you what it really is
I can only tell you what it feels like
And right now it's a steel knife in my windpipe
I can't breathe but I still fight while I can fight
As long as the wrong feels right it's like I'm in flight
High off of love, drunk from my hate,
It's like I'm huffing paint and I love it the more I suffer, I suffocate
And right before I'm about to drown, she resuscitates me
She fucking hates me and I love it.
Wait! Where you going?
"I'm leaving you"
No you ain't. Come back we're running right back.
Here we go again
It's so insane cause when it's going good, it's going great
I'm Superman with the wind at his back, she's Lois Lane
But when it's bad it's awful, I feel so ashamed I snapped
Who's that dude? I don't even know his name
I laid hands on her, I'll never stoop so low again
I guess I don't know my own strength

[Chorus - Rihanna:]
Just gonna stand there and watch me burn
But that's alright because I like the way it hurts
Just gonna stand there and hear me cry
But that's alright because I love the way you lie
I love the way you lie
I love the way you lie

[Verse - Eminem:]
You ever love somebody so much you can barely breathe
When you're with 'em
You meet and neither one of you even know what hit 'em
Got that warm fuzzy feeling
Yeah, them chills you used to get 'em
Now you're getting fucking sick of looking at 'em
You swore you'd never hit 'em; never do nothing to hurt 'em
Now you're in each other's face spewing venom in your words when you spit them
You push, pull each other's hair, scratch, claw, hit 'em
Throw 'em down, pin 'em
So lost in the moments when you're in them
It's the rage that took over it controls you both
So they say you're best to go your separate ways
Guess if they don't know you 'cause today that was yesterday
Yesterday is over, it's a different day
Sound like broken records playing over but you promised her
Next time you show restraint
You don't get another chance
Life is no Nintendo game
But you lied again
Now you get to watch her leave out the window
Guess that's why they call it window "pain"

[Chorus - Rihanna:]
Just gonna stand there and watch me burn
But that's alright because I like the way it hurts
Just gonna stand there and hear me cry
But that's alright because I love the way you lie
I love the way you lie
I love the way you lie

[Verse - Eminem:]
Now I know we said things, did things that we didn't mean
And we fall back into the same patterns, same routine
But your temper's just as bad as mine is
You're the same as me
But when it comes to love you're just as blinded
Baby, please come back
It wasn't you, baby it was me
Maybe our relationship isn't as crazy as it seems
Maybe that's what happens when a tornado meets a volcano
All I know is I love you too much to walk away though
Come inside, pick up your bags off the sidewalk
Don't you hear sincerity in my voice when I talk
Told you this is my fault
Look me in the eyeball
Next time I'm pissed, I'll lay my fist at the drywall
Next time. There won't be no next time
I apologize even though I know its lies
I'm tired of the games I just want her back
I know I'm a liar
If she ever tries to fucking leave again
Im'a tie her to the bed and set this house on fire
I'm just gonna

[Outro - Rihanna:]
Just gonna stand there and watch me burn
But that's alright because I like the way it hurts
Just gonna stand there and hear me cry
But that's alright because I love the way you lie
I love the way you lie
I love the way you lie
EOF

song_1 = Song.create!(
  :name => "Love The Way You Lie",
  :artist => "Eminem, Rhianna",
  :lyrics => lyrics_1,
)

sync_file_1 = SyncFile.new(
  :timecode => "10,14,17,21,23,25,27,29,30,33,35,36,37,40,42,45"
)

sync_file_1.song = song_1
sync_file_1.save!
