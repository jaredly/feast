
Scenarios:

- redux y
- db y
- server y

- redux y
- db n jk ???

- redux y
- db y
- server plz rebase
- redux rebase
- db ???
- server ok here thanks

Thoughts:
Ok maybe the db just has to deal? not allowed to fail. b/c why would it?
on the other hand, maybe we have a list of unsynced actions in the DB (well
actually we totally do need it to live there for persistance), and then we only
update the in-place DB once we've synced with the central server. That way the
client DB never has to worry about a rebase.

And so the only issue is if you are offline for a *long* time, then starting up the app would take a while b/c you're replaying a ton of actions on your database state. And this would happen every time you want to get new things from the db state..... hmmmmm is there a way to know which things will effect what you're working on?

OK let's just try having the whole DB in memory. should be a breeze.
Right? :DDD

Yeah, I think it's totally not going to be a big deal.

