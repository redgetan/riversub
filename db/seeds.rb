# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

lyrics1 = <<EOF
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

lyrics2 = <<EOF
So sentimental, not sentimental no
Romantic not disgusting yet
Darling, I'm down and lonely when with the fortunate only
I've been looking for something else
Do let, do let, do let, jugulate, do let, do let, do

Let's go slowly discouraged
Distant from other interests on your favorite weekend ending
This love's for gentlemen only that's with the fortunate only
No, I gotta be someone else
These days it comes, it comes, it comes, it comes, it comes and goes

Lisztomania
Think less but see it grow like a riot, like a riot, oh
I'm not easily offended
It's not hard to let it go from a mess to the masses

Lisztomania
Think less but see it grow like a riot, like a riot, oh
I'm not easily offended
It's not hard to let it go from a mess to the masses

Follow, misguide, stand still
Disgust, discourage on this precious weekend ending
This love's for gentlemen only, wealthiest gentlemen only
And now that you're lonely
Do let, do let, do let, jugulate, do let, do let, do

Let's go slowly discouraged, we'll burn the pictures instead
When it's all over we can barely discuss
For one minute only, not with the fortunate only
Thought it could have been something else
These days it comes, it comes, it comes, it comes, it comes and goes

Lisztomania
Think less but see it grow like a riot, like a riot, oh
I'm not easily offended
It's not hard to let it go from a mess to the masses

Lisztomania
Think less but see it grow like a riot, like a riot, oh
I'm not easily offended
It's not hard to let it go from a mess to the masses

This is show time, this is show time, this is show time
This is show time, this is show time, this is show time
Time, time is your love, time is your love, yes time is your
Time, time is your love, time is your love, yes time is your

From the mess to the masses

Lisztomania
Think less but see it grow like a ride, like a ride, oh
Discuss, discuss, discuss
Discuss, discuss, discouraged
EOF

song1 = Song.create!(
  :name => "Love The Way You Lie",
  :artist => "Eminem, Rhianna",
  :lyrics => lyrics1,
)

song1.sync_files.create!(
  :timecode => "0,0.2,4,10,16,21,25,25.2,25.5,27,30,32,35,38,40,44,46,48,50,51,53,54,57,60,63,66,68,70,70.2,70.4,74,80,85,91,95,100"
)

song1.media_sources.create!(
  :media_type => "video",
  :url => "http://www.youtube.com/watch?v=uelHwf8o7_U",
  :votes => 2
)

song2 = Song.create!(
  :name => "Lisztomania",
  :artist => "Phoenix",
  :lyrics => lyrics2,
)

song2.media_sources.create!(
  :media_type => "video",
  :url => "http://www.youtube.com/watch?v=Dq741YqlP7w"
)
