import { Elysia } from "elysia";
import { supabase } from "../supabase.js";

export const fileRoutes =
new Elysia({
  prefix: "/files"
})

.post(
"/medical-files",
async ({ body, set }) =>
{
  console.log(
  "BODY:",
  body
);
  const {

  patient_id,

  guest_email,

  guest_contact,

  uploaded_by,

  uploaded_by_role,

  document_category,

  file_name,

  storage_path,

  file_type,

  mime_type,

  size_bytes,

  taken_at

} = body;

const {
  data,
  error
} = await supabase
  .from("medical_files")
  .insert([
{
  patient_id:
    patient_id,

  guest_email:
    guest_email,

  guest_contact:
    guest_contact,

  uploaded_by,

  uploaded_by_role,

  document_category,

  file_type,

  title:
    file_name,

  notes:
    "",

  taken_at:
    taken_at.split("T")[0],

  file_name,

  storage_path,

  file_url:
    "",

  mime_type,

  size_bytes
}
])
  .select()
  .single();

console.log("INSERT DATA:", data);
console.log("INSERT ERROR:", error);

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true,
    file: data
  };
  console.log(
  "INSERT ERROR:",
  error
);
})

.delete("/medical-files/:fileId",
async ({ params, set }) =>
{
  const { data, error } =
    await supabase
      .from("medical_files")
      .select("*")
      .eq("id", params.fileId)
      .single();

  if(error)
  {
    set.status = 404;

    return {
      success: false
    };
  }

  const filePath =
  data.storage_path;

  await supabase.storage
  .from("medical-files")
  .remove([filePath]);

  await supabase
    .from("medical_files")
    .delete()
    .eq("id", params.fileId);

  return {
    success: true
  };
})

.patch(
"/medical-files/:fileId/archive",
async ({ params, set }) =>
{
  const {
    error
  } =
  await supabase
    .from("medical_files")
    .update({
      is_archived: true
    })
    .eq(
      "id",
      params.fileId
    );

  if(error)
  {
    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  return {
    success: true
  };
})

.get(
"/medical-files/:patientId",
async ({ params, set }) =>
{
  let data = [];
  let error = null;

  if(
    params.patientId.startsWith("guest-")
  )
  {
    const email =
      params.patientId.replace(
        "guest-email-",
        ""
      );

    const result =
      await supabase
        .from("medical_files")
        .select("*")
        .eq(
          "guest_email",
          email
        )
        .eq(
          "is_archived",
          false
        );

    data = result.data;
    error = result.error;
  }
  else
  {
    const result =
      await supabase
        .from("medical_files")
        .select("*")
        .eq(
          "patient_id",
          params.patientId
        )
        .eq(
          "is_archived",
          false
        );

    data = result.data;
    error = result.error;
  }

  if(error)
  {
    console.error(error);

    set.status = 500;

    return {
      success: false,
      message: error.message
    };
  }

  const files =
    await Promise.all(

      (data || []).map(
        async (file) =>
        {
          let fileUrl =
            file.file_url;

          if(file.storage_path)
          {
            const {
              data: signedData
            } =
            await supabase.storage
              .from("medical-files")
              .createSignedUrl(
                file.storage_path,
                3600
              );

            if(signedData)
            {
              fileUrl =
                signedData.signedUrl;
            }
          }

          return {
            ...file,
            file_url:
              fileUrl
          };
        }
      )

    );

  return {
    success: true,
    files
  };
})

.post(
"/billing",
async ({ body, set }) =>
{
  const {
    patient_id,
    guest_email,
    guest_contact,
    uploaded_by,
    uploaded_by_role,
    document_type,
    file_name,
    storage_path,
    mime_type,
    size_bytes
  } = body;

  const { data, error } =
  await supabase
    .from("billing_documents")
    .insert([
      {
        patient_id,
        guest_email,
        guest_contact,
        uploaded_by,
        uploaded_by_role,
        document_type,
        title:file_name,
        storage_path,
        mime_type,
        size_bytes
      }
    ])
    .select()
    .single();

  if(error)
  {
    set.status=500;

    return{
      success:false,
      message:error.message
    };
  }

  return{
    success:true,
    document:data
  };
})

.get(
"/billing/:patientId",
async ({ params }) =>
{
  let query =
  supabase
  .from("billing_documents")
  .select("*")
  .eq("is_archived",false);

  if(
    params.patientId.startsWith(
      "guest-email-"
    )
  )
  {
    query =
    query.eq(
      "guest_email",
      params.patientId.replace(
        "guest-email-",
        ""
      )
    );
  }
  else
  {
    query =
    query.eq(
      "patient_id",
      params.patientId
    );
  }

  const {
    data
  } =
  await query;

  const documents =
await Promise.all(

(data || []).map(
async (doc)=>
{
let fileUrl =
doc.file_url;

if(
doc.storage_path &&
doc.storage_path.includes("/")
)
{
const {
data: signedData
}
=
await supabase.storage
.from("medical-files")
.createSignedUrl(
doc.storage_path,
60*60
);

if(signedData)
{
fileUrl =
signedData.signedUrl;
}
}

return {
...doc,
file_url:fileUrl
};

})
);

return{
success:true,
documents
};
})

.patch(
"/billing/:id/archive",
async ({ params }) =>
{
  await supabase
  .from("billing_documents")
  .update({
    is_archived:true
  })
  .eq(
    "id",
    params.id
  );

  return{
    success:true
  };
})