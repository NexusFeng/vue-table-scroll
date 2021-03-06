import LayoutObserver from './layout/observer'

export default {
  name: 'TableHeader',
  mixins: [LayoutObserver],

  props: {
    // eslint-disable-next-line vue/require-prop-types
    store: {
      required: true
    }
  },

  computed: {
    table() {
      return this.$parent
    }
  },
  render() {
    const tableHeader = this.store.tableHeader
    const isIndex = this.table.mergeOption.index
    return (
      <table class="el-table_header" cellspacing="0" cellpadding="0" border="0">
        <colgroup>
          {isIndex && <col name={'column_0'} width="50" />}
          {tableHeader.map(
            (column, index) =>
              !column.hidden && <col name={`column_${index + 1}`} />
          )}
        </colgroup>
        <thead class={['is-group']}>
          {
            <tr>
              {isIndex && <th class={['el-table__cell', 'is-center']}>序号</th>}
              {tableHeader.map(
                column =>
                  !column.hidden && (
                    <th
                      colspan={column.colSpan}
                      rowspan={column.rowSpan}
                      key={column.id}
                      class={['el-table__cell', 'is-center']}
                    >
                      <div class={['cell']}>{column.label}</div>
                    </th>
                  )
              )}
            </tr>
          }
        </thead>
      </table>
    )
  }
}
