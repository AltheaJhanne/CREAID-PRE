import { useState, useEffect } from "react";
import "../styles/inbox.css";
import { supabase } from "../lib/supabase";
import { useRef } from "react";

function Inbox() 
{
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [tickets, setTickets] =
  useState([]);

  const [ticketFilter, setTicketFilter] =
  useState("open");

  const [selectedTicket, setSelectedTicket] =
  useState(null);

  const [showTicketList, setShowTicketList] =
  useState(false);
  const currentUser =
  JSON.parse(
    localStorage.getItem("user")
  );
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef(null);

const currentUserId =
  currentUser?.id;

  console.log(
  "CURRENT USER:",
  currentUserId
);

useEffect(() => {

  loadConversations();

  loadTickets();

}, []);

useEffect(() => {

  const channel =
    supabase
      .channel(
        "messages-realtime"
      )

      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        (payload) => {

          console.log(
            "NEW MESSAGE:",
            payload
          );

          if(
            selectedConversation
          )
          {
            loadMessages(
              selectedConversation.id
            );
          }

          loadConversations();
        }
      )

      .on(
  "postgres_changes",
  {
    event: "*",
    schema: "public",
    table: "support_tickets"
  },
  () =>
  {
    loadTickets();
  }
)

      .subscribe();

  return () => {
    supabase.removeChannel(
      channel
    );
  };

}, [selectedConversation]);

/*
useEffect(() => {

  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth"
  });

}, [messages]);
*/

async function loadMessages(
  otherUserId,
  ticketId = null
)
{
  try
  {
    let query =
  supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
    );

query =
  ticketId
    ? query.eq(
        "ticket_id",
        ticketId
      )
    : query.is(
        "ticket_id",
        null
      );

const {
  data,
  error
} =
await query.order(
  "created_at",
  {
    ascending:true
  }
);

    if(error)
    {
      console.error(error);
      return;
    }

    setMessages(data || []);
  }
  catch(error)
  {
    console.error(error);
  }
}

async function openTicketConversation(
  ticket
)
{
  const conversation =
    getConversationForTicket(
      ticket
    );

  setSelectedConversation(
    conversation
  );

  setSelectedTicket(
    ticket
  );

  await supabase
    .from("messages")
    .update({
      read:true
    })
    .eq(
      "sender_id",
      conversation.id
    )
    .eq(
      "receiver_id",
      currentUserId
    )
    .eq(
      "ticket_id",
      ticket.id
    )
    .eq(
      "read",
      false
    );

  await loadMessages(
    conversation.id,
    ticket.id
  );

  loadConversations();

  loadTickets();
}

async function loadConversations()
{
  try
  {
    const {
      data: users,
      error
    } = await supabase
      .from("users")
      .select(`
      id,
      first_name,
      last_name,
      role,
      avatar_url
      `)
      .in(
        "role",
        [
          "patient",
          "dentist"
        ]
      )
      .eq(
        "is_archived",
        false
      );

    if(error)
    {
      console.error(error);
      return;
    }

    const conversationsWithPreview =
      await Promise.all(

        (users || []).map(
  async (user) =>
  {
    const {
      data: latestMessage
    } = await supabase
      .from("messages")
      .select(`
        content,
        created_at
      `)
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${currentUserId})`
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      )
      .limit(1)
      .maybeSingle();

    const {
      data: unreadMessages
    } = await supabase
      .from("messages")
      .select("id")
      .eq("sender_id", user.id)
      .eq("receiver_id", currentUserId)
      .eq("read", false);

    return {
              id: user.id,

              name:
                `${user.first_name} ${user.last_name}`,

              role:
                user.role,

              avatar_url:
                user.avatar_url,

              unread:
              unreadMessages?.length || 0,

              preview:
                latestMessage?.content ||
                "No messages yet",

              time:
                latestMessage?.created_at || ""
            };
          }
        )
      );

    setConversations(
  conversationsWithPreview.sort(
    (a, b) =>
      new Date(b.time || 0) -
      new Date(a.time || 0)
  )
);
  }
  catch(error)
  {
    console.error(error);
  }
}

const activeUserTickets =
  selectedConversation
    ? tickets.filter(
        ticket =>
          ticket.requester_id ===
          selectedConversation.id
      )
    : [];

const filteredTickets =
  activeUserTickets.filter(
    ticket =>
      ticketFilter === "all"
        ? true
        : ticketFilter === "closed"
          ? ticket.status === "closed"
          : ticket.status !== "closed"
  );

const openTicketCount =
  activeUserTickets.filter(
    ticket =>
      ticket.status !== "closed"
  ).length;

const closedTicketCount =
  activeUserTickets.filter(
    ticket =>
      ticket.status === "closed"
  ).length;

const filteredConversations =
  conversations.filter(
    (c) =>
      c.name
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  async function loadTickets()
{
  try
  {
    let query =
      supabase
        .from("support_tickets")
        .select("*")
        .order(
          "updated_at",
          {
            ascending: false
          }
        );

    if(currentUserId)
    {
      query =
        query.eq(
          "assigned_to",
          currentUserId
        );
    }

    const {
      data,
      error
    } =
      await query;

    if(error)
    {
      throw error;
    }

    setTickets(
      data || []
    );
  }
  catch(error)
  {
    console.error(error);

    setTickets([]);
  }
}

async function updateTicketStatus(
ticket,
status
)
{
const {
data,
error
}
=
await supabase
.from(
"support_tickets"
)
.update({

status,

updated_at:
new Date()
.toISOString()

})
.eq(
"id",
ticket.id
)
.select()
.single();

if(error)
{
console.error(error);

alert(
"Unable to update ticket."
);

return;
}

if(
selectedTicket?.id ===
ticket.id
)
{
setSelectedTicket(
data
);
}

await loadTickets();
}

function formatConversationTime(dateValue)
{
  if(!dateValue)
  {
    return "";
  }

  const date =
    new Date(dateValue);

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1
  );

  const isToday =
    date.toDateString() ===
    today.toDateString();

  const isYesterday =
    date.toDateString() ===
    yesterday.toDateString();

  if(isToday)
  {
    return date.toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
  }

  if(isYesterday)
  {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric"
    }
  );
}

function formatMessageTime(dateValue)
{
  return new Date(dateValue)
    .toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );
}

function formatDateSeparator(dateValue)
{
  const date =
    new Date(dateValue);

  const today =
    new Date();

  const yesterday =
    new Date();

  yesterday.setDate(
    today.getDate() - 1
  );

  if(
    date.toDateString() ===
    today.toDateString()
  )
  {
    return "Today";
  }

  if(
    date.toDateString() ===
    yesterday.toDateString()
  )
  {
    return "Yesterday";
  }

  return date.toLocaleDateString(
    [],
    {
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function shouldShowDateSeparator(
  currentMessage,
  previousMessage
)
{
  if(!previousMessage)
  {
    return true;
  }

  return (
    new Date(
      currentMessage.created_at
    ).toDateString()
    !==
    new Date(
      previousMessage.created_at
    ).toDateString()
  );
}

function getConversationForTicket(
  ticket
)
{
  return (
    conversations.find(
      c =>
        c.id ===
        ticket.requester_id
    ) ||
    {
      id:
        ticket.requester_id,

      name:
        ticket.requester_id,

      role:
        "patient",

      preview:
        ticket.subject ||
        "Ticket",

      unread:0,

      time:
        ticket.updated_at ||
        ticket.created_at
    }
  );
}

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="dashboard-content">
          <div className="inbox-container">
            <div
  className={`inbox-sidebar ${
    selectedTicket ? "collapsed" : ""
  }`}
>
              <h2 className="inbox-title">Inbox</h2>

              <input
  className="inbox-search"
  placeholder="Search"
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
/>

              <div className="conversation-list">
                {filteredConversations.map((c) => (
                  <div
  key={c.id}
  className={`conversation-item ${
    selectedConversation?.id === c.id
      ? "active"
      : ""
  }`}
  onClick={async () =>
{
  setSelectedConversation(c);

  await supabase
    .from("messages")
    .update({
      read: true
    })
    .eq("sender_id", c.id)
    .eq("receiver_id", currentUserId)
    .eq("read", false);

  loadMessages(c.id);
  loadConversations();
}}
>
                    {
  c.avatar_url ? (

    <img
      src={c.avatar_url}
      className="avatar"
      alt=""
    />

  ) : (

    <div className="avatar avatar-placeholder">

      {c.name
        ?.charAt(0)
        ?.toUpperCase()}

    </div>

  )
}

                    <div className="conversation-info">
                      <div className="conversation-top">
                        <span className="name">{c.name}</span>
                        <span className="time">
                          {formatConversationTime(c.time)}
                          </span>
                        <small
                          style={{
                          color:"#999"
                        }}
                        >
                        {c.role}
                        </small>
                      </div>
                      <p className="preview">{c.preview}</p>
                      {c.unread > 0 && (
  <span className="unread-badge">
    {c.unread}
  </span>
)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chat-panel">

  {!selectedConversation ? (

    <div className="chat-empty">
      Select a conversation
      to view messages
    </div>

  ) : (

    <>
<div className="chat-header">

  <div className="chat-header-main">

    <h3>

      {
        selectedTicket
          ? (
              selectedTicket.ticket_number ||
              "Ticket"
            )
          : (
              selectedConversation?.name || ""
            )
      }

    </h3>

    <div className="chat-user-meta">

    <span className="chat-user-name">

        {selectedConversation?.name}

    </span>

    <span className="chat-user-role">

        {
        selectedTicket
        ? selectedTicket.status
        : selectedConversation?.role
        }

    </span>

</div>

    {
      selectedTicket && (

        <p className="chat-ticket-subject">

          {
            selectedTicket.subject ||
            "No subject"
          }

        </p>

      )
    }

  </div>

  <div className="chat-header-actions">

    <button
      type="button"
      className="chat-action-btn secondary"
      onClick={() =>
        setShowTicketList(current => !current)
      }
    >
      {
        showTicketList
          ? "Hide Tickets"
          : "Show Tickets"
      }
    </button>

    {
      selectedTicket && (

        <>

          <button
            type="button"
            className="chat-action-btn secondary"
            onClick={() =>
            {
              setSelectedTicket(null);

              loadMessages(
                selectedConversation.id,
                null
              );
            }}
          >

            Back to PM

          </button>

          {
            selectedTicket.status === "closed"

            ?

            (

              <button
                type="button"
                className="chat-action-btn warning"
                onClick={() =>
                  updateTicketStatus(
                    selectedTicket,
                    "open"
                  )
                }
              >

                Undo Close

              </button>

            )

            :

            (

              <button
                type="button"
                className="chat-action-btn success"
                onClick={() =>
                  updateTicketStatus(
                    selectedTicket,
                    "closed"
                  )
                }
              >

                Mark Done

              </button>

            )

          }

        </>

      )
    }

  </div>

</div>

      <div
  className={`chat-body ${
    showTicketList
      ? "with-ticket-side"
      : ""
  }`}
>

<div className="messages-area">

  {messages.map(
    (msg, index) => {

      const isStaff =
        msg.sender_id === currentUserId;

      const showDate =
        shouldShowDateSeparator(
          msg,
          messages[index - 1]
        );

      return (
        <div key={msg.id || index}>

          {showDate && (
            <div className="date-separator">
              <span>
                {formatDateSeparator(
                  msg.created_at
                )}
              </span>
            </div>
          )}

          <div
            className={`message-row ${
              isStaff
                ? "staff-row"
                : "other-row"
            }`}
          >
            <div
              className={`message-bubble ${
                isStaff
                  ? "staff"
                  : "other"
              }`}
            >
              <div className="message-text">
                {msg.content}
              </div>

              <div className="message-meta">

                {formatMessageTime(
                  msg.created_at
                )}

                {isStaff && (
                  <span className="message-status">
                    {msg.read
                      ? "✓✓ Seen"
                      : "✓ Delivered"}
                  </span>
                )}

              </div>
            </div>
          </div>

        </div>
      );
    }
  )}

  <div ref={messagesEndRef}></div>

</div>


{
showTicketList && (

<div className="ticket-panel">

<div className="ticket-panel-header">

<strong>

Tickets

</strong>

<span className="ticket-summary">

{openTicketCount} Open • {closedTicketCount} Closed

</span>

</div>

<div className="ticket-filter-row">

{
[
["all","All"],
["open","Open"],
["closed","Closed"]
].map(
([filter,label]) => (

<button
key={filter}
className={
ticketFilter === filter
? "ticket-filter active"
: "ticket-filter"
}
onClick={() =>
setTicketFilter(filter)
}
>

{label}

</button>

))
}

</div>

<div className="ticket-list">

{
filteredTickets.length === 0
?

<div className="ticket-empty">

No tickets.

</div>

:

filteredTickets.map(ticket => (

<button
key={ticket.id}
className="ticket-item ticket-item-button"
onClick={() =>
openTicketConversation(ticket)
}
>

<div className="ticket-item-main">

    <strong>
        {ticket.ticket_number || "Ticket"}
    </strong>

    <p className="ticket-description">
        {ticket.subject || "No subject"}
    </p>

    <div className="ticket-footer">

        <span
            className={`ticket-status ${ticket.status.toLowerCase()}`}
        >
            {ticket.status}
        </span>

    </div>

</div>

</button>

))
}

</div>

</div>

)
}

</div>

<div className="chat-input">

  <input
  disabled={
  selectedTicket?.status ===
  "closed"
  }
    placeholder={
selectedTicket?.status === "closed"
?
"Ticket is closed"
:
"Type a message..."
}
    value={message}
    onChange={(e) =>
      setMessage(
        e.target.value
      )
    }
    onKeyDown={(e) =>
    {
      if(e.key === "Enter")
      {
        e.preventDefault();

        document
        .querySelector(".chat-send-btn")
        ?.click();
      }
    }}
  />

  <button
    className="chat-send-btn"
    onClick={async () => {

      if(
        !message.trim()
        ||
        !selectedConversation
      )
      {
        return;
      }

      const content =
        message.trim();

      setMessage("");

      const { error } =
        await supabase
          .from("messages")
          .insert({
          sender_id:
            currentUserId,

          receiver_id:
            selectedConversation.id,

          ticket_id:
            selectedTicket?.id || null,

          content,

          read: false
        });

      if(error)
      {
        console.error(error);
        return;
      }

      await supabase
        .from("notifications")
        .insert({
          user_id:
            selectedConversation.id,

          type:
            "message",

          title:
          selectedTicket
          ? "New Ticket Reply"
          : "New Message",

          content:
          selectedTicket
          ?
          `${currentUser?.first_name || "Staff"} replied to ${
          selectedTicket.ticket_number || "your ticket"
          }.`
          :
          `${currentUser?.first_name || "Staff"} sent you a message.`,

          read: false
        });

      await loadMessages(
selectedConversation.id,
selectedTicket?.id || null
);

      await loadConversations();

    }}
  >
    ➤
  </button>

</div>

    </>

  )}

</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inbox;