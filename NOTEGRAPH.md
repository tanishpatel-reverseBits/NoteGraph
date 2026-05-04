# NoteGraph

A linked knowledge base with version history. NoteGraph is a notes application built around a single idea: connections between notes are first-class. Instead of treating each note as an isolated document, NoteGraph turns a collection of notes into a living graph where every reference is tracked, every edit is preserved, and nothing is ever lost.

## What the App Is

NoteGraph is a place to write notes that reference each other. You write a note the way you would in any notes app — give it a title, write a body, add a few tags if you want. The difference is what happens when you mention another note inside that body. By wrapping a note's title in double brackets, like `[[Project Brief]]`, you create a live link to that note. The application notices the link, records it, and from that point on the two notes are connected.

Connections are not something you manage by hand. You never open a "links" panel or attach notes to each other manually. You write naturally, and the application keeps the web of connections in sync with what you wrote. If you remove a `[[Project Brief]]` mention from a note, that link disappears. If you add a new one, that link appears. The recorded connections always match exactly what is written in the body.

If you reference a note that does not exist yet, NoteGraph does not complain or break the link. It quietly creates an empty placeholder for that title so the connection is never lost. The placeholder sits there waiting until you decide to write something into it. Once you do, it becomes a real note with content, and the link that was already pointing to it is now pointing to a real destination.

## Backlinks

Every note has two sides to its connections. There are the notes it points to — the wikilinks written inside its own body. And there are the notes that point back at it — the backlinks. When you open any note in NoteGraph, you see not only what you wrote but also a panel showing every other note that currently links to this one. Backlinks are not something the user maintains. They are derived live from the connections recorded across all notes, so they are always accurate and always up to date.

This is what makes NoteGraph feel different from a normal notes app. A note is no longer just its own content. It is its content plus the surrounding context of everything that mentions it. A meeting summary you wrote three months ago might suddenly show up as a backlink on a note you opened today, reminding you of a discussion you had forgotten.

## Soft Deletion and Broken Links

Notes in NoteGraph are never truly erased. When you delete a note, it is hidden from view but kept in the system. Anything that was linking to it does not have its body changed — the original `[[Note Title]]` text stays exactly as written. What changes is the status of the link itself: it is now flagged as broken, because its destination is no longer reachable.

Broken links are visible to the user. In the graph view, in the editor, and anywhere else links appear, a broken link looks different from a healthy one so you can tell at a glance that something it depended on is gone.

The interesting part is what happens when the missing note comes back. If you restore the deleted note, or if you create a brand new note with the same title, NoteGraph automatically heals every broken link that was waiting on that title. No manual cleanup. The connections were never really lost — they were just waiting for their destination to return.

## Version History

Every edit to a note is preserved automatically. You do not press a "save version" button. You do not check a box that says "keep history." You just write. Every time you save a change, the previous version of the body is snapshotted and stored permanently with a sequential version number. Versions accumulate forever — the system never throws any away.

You can browse the version history of any note in reverse chronological order and open any past snapshot to see exactly what the note said at that moment in time. You can pick any two versions and compare them line by line, with each line marked as added, removed, or unchanged so you can see precisely what changed between two points in the note's life.

If you want to bring back an older version, you can restore it. Restoring sets the current body to the content of that older snapshot — but it does not erase any history. The restore itself becomes a new version on top of everything that came before. History only grows; it never gets rewritten.

## The Knowledge Graph

Underneath all of this is a graph. Every active note is a node. Every wikilink is an edge between nodes. NoteGraph exposes this graph as a single structured view of the entire knowledge base, and the frontend renders it as an interactive canvas.

In the graph view you see your whole collection of notes laid out visually. Edges show which notes connect to which. Broken edges are visually distinguished from healthy ones, so you can immediately see where your knowledge has gaps. Placeholder notes — the ones that were auto-created because something linked to them but no one has written content yet — are also visually distinguishable from real notes, so you can see at a glance which titles are waiting to be filled in.

Clicking any node in the graph opens that note. The graph is not a separate world from the notes — it is another way of moving through the same knowledge.

## The Editor Experience

Writing in NoteGraph is meant to feel ordinary until the moment a connection appears. You type a title, you type a body, you add tags. When you type `[[`, the editor begins suggesting existing note titles. You can keep typing to narrow the suggestions down, and selecting one inserts the formatted link for you. This is the only friction point between writing prose and creating structure, and it is intentionally light.

Beyond the editor, every note's detail view shows the backlinks panel — the list of other notes currently pointing to this one. The version history panel sits alongside it, letting you browse past snapshots and run a colour-coded diff between any two of them. The graph canvas is one click away, showing where this note sits in the larger web.

## Searching

Search in NoteGraph is intentionally simple. You can filter notes by a keyword in the title, or by a specific tag. The point of search is to find your way back into the graph — once you land on a note, the connections take over and let you move through related ideas without searching again.

## What NoteGraph Promises

The application is built around a few quiet guarantees that hold no matter what the user does:

- No note is ever permanently erased. Deletion is always reversible.
- No version is ever lost. History only grows.
- The recorded connections always match the words on the page. The user never has to keep them in sync.
- A reference to a note that does not exist creates a placeholder rather than a dead end.
- A reference to a deleted note becomes a broken link that heals itself the moment the destination comes back.
- Backlinks are always accurate, because they are derived from the live state of every note in the system.

The result is a notes application where ideas accumulate without friction, where context is never lost, and where the structure of your knowledge emerges from the act of writing rather than from any manual organisation.
