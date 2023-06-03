use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use bson::oid::ObjectId;
use crate::Result;
use crate::terminal_delegate::TerminalDelegate;

pub(crate) struct AppState {
  inner: Arc<Mutex<AppStateInner>>
}

impl AppState {

  pub(crate) fn new() -> AppState {
    AppState {
      inner: Arc::new(Mutex::new(AppStateInner {
        terminals: HashMap::new(),
      }))
    }
  }

  pub(crate) fn new_terminal(&self, buffer_callback: Box<dyn Fn(&TerminalDelegate, &[u8]) -> Result<()> + Send>) -> Result<TerminalDelegate> {
    let delegate: TerminalDelegate = TerminalDelegate::new(buffer_callback)?;
    {
      let mut inner = self.inner.lock().unwrap();
      inner.insert_terminal(delegate.clone());
    }
    Ok(delegate)
  }

  pub(crate) fn get_terminal_by_id(&self, id: ObjectId) -> TerminalDelegate {
    let inner = self.inner.lock().unwrap();
    inner.terminals.get(&id).unwrap().clone()
  }

  pub(crate) fn remove_terminal_by_id(&self, id: ObjectId) {
    let mut inner = self.inner.lock().unwrap();
    inner.terminals.remove(&id);
  }
    
}

struct AppStateInner {
  terminals: HashMap<ObjectId, TerminalDelegate>,
}

impl AppStateInner {

  fn insert_terminal(&mut self, terminal: TerminalDelegate) {
    let id = terminal.id();
    self.terminals.insert(id, terminal);
  }
    
}
