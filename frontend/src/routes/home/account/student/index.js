/*
* 学生账号管理
* */


import React, {Component} from 'react'
import {connect} from 'dva'
import {Card, Button, Input, Table, Checkbox, Pagination, Switch, Tooltip,Select,Icon, Popconfirm, message, Tag} from 'antd'
import './index.css'
import {phoneCheck,emailCheck} from '../../../../components/utils'
import {editStudent} from '../../../../services'
import {Prompt} from 'dva/router'

const Search = Input.Search;
const Option = Select.Option;

class Student extends Component {
  constructor(props) {
    super(props)
    const {student_data,school_data,school_from_id} = this.getData(props)
    this.state = {
      when: false,
      batch_operation: false,//批量操作
      indeterminate: false,//check的不确定状态
      check_number: 0,//选中的条目数
      check_data: {},//选中的数据
      loading: true,//获取数据的loading
      current: 1,//第几页
      pageSize: 10,//每页条数
      total: student_data.length,//数据总数
      dataSource: student_data,
      school_data,//学校数据
      school_from_id:school_from_id,
      search_value:'',//搜索的数据
      newly_increased:false,//新增控制
      edited: {  //编辑
        edited_target: {},  //需要编辑的数据
        edited_visible: false,//是否编辑
      }
    }
  }

  getData = (props) => {
    const {student: {get_data, student_data,school_data,school_from_id}} = props
    if (!get_data) {
      dispatch({
        type: "student/getStudentData",
        payload: {}
      })
    }
    return {student_data,school_data,school_from_id}
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true
  }

  componentWillReceiveProps(nextProps) {
    const {student} = nextProps
    const {status, student_data, message: student_message,school_data,school_from_id} = student
    if (status) {
      this.setState({
        dataSource: student_data,
        total: student_data.length,
        school_data,school_from_id
      })
    } else {
      message.warning(student_message)
    }
  }

  componentDidMount() {
    // this.props.router.setRouteLeaveHook(this.props.router, () => {
    //   return 'funk away'
    // })
  }

  componentWillUnmount() {

  }

  title = () => {
    const {batch_operation, edited: {edited_visible},newly_increased} = this.state
    const onChangeBatch = () => {
      this.setState({
        batch_operation: !batch_operation
      })
    }
    const onSearch=(value)=>{
      this.setState({
        search_value:value
      })
    }
    const newlyIncreasedClick=()=>{
      this.setState({
        newly_increased:true,
        when:true,
        edited:{edited_visible:true,
          edited_target:{id:'新增',school:'',}}
      })
    }
    return (
      <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between'}}>
        <div>
          <Button type="primary" style={{marginRight: 5}} disabled={true}>
            添加学生
          </Button>
          <Button onClick={onChangeBatch} disabled={edited_visible}>
            批量操作
          </Button>
        </div>
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start'}}>
          <Button style={{marginRight:5}}disabled={edited_visible}
                  onClick={newlyIncreasedClick}>新增</Button>
          <Search addonBefore="搜索" onSearch={onSearch}/>
        </div>
      </div>
    )
  }

  secondHeadArea = () => {
    const {check_number, check_data, total} = this.state
    const name = []
    const close_log = (i) => {
      const number = check_number - 1
      this.setState({
        indeterminate: !number ? false : number !== total,
        check_data: {
          ...check_data, [i]: {...check_data[i], checked: false}
        },
        check_number: check_number - 1
      })

    }
    for (let i in check_data) {
      if (check_data[i].checked) {
        name.push(<Tag closable
                       key={i}
                       onClose={() => close_log(i)}
                       style={{margin: "3px 5px"}}
        >{check_data[i].name}</Tag>)
      }
    }
    return (
      <div className="second-head-area">
        <div style={{display: 'flex', alignItems: 'center', flexWrap: "wrap",}}>
          <Icon type="info-circle" style={{fontSize: 15, color: '#3E8EE2'}}/>
          <span style={{marginLeft: 15, marginRight: 10}}>已选择
          <span style={{color: "#108EE9", margin: '0 3px'}}>{check_number}</span>人:</span>

          {name}
        </div>
      </div>
    )
  }

//修改数据
  conservationData=({value})=>{
    editStudent(value).then(resp=>{
      console.log('数据保存成功',resp)
      dispatch({
        type: "student/getStudentDataSingle",
        payload: {}
      })
      if(!resp.status) message.info('数据保存失败，请联系管理员')
      else message.success("数据保存成功")
    })
  }

  tableArea = () => {
    const {
      batch_operation, current, pageSize, total, indeterminate, check_number, dataSource,
      check_data, edited,school_data,school_from_id,search_value,newly_increased
    } = this.state
    const {edited_visible, edited_target} = edited

    const filter_data=dataSource.filter(i=>i.name.indexOf(search_value)!==-1)
    const table_data=newly_increased?[edited_target,...filter_data]:[...filter_data]
    const fontSize = 12
    const text = "你确定要删除这行内容吗？"
    const reset_text="你确定要重置密码吗？"
    const columns = []

    const options=school_data.map(i=><Option key={i.id.toString()} value={i.id.toString()}>{i.alias}</Option>)

    const onCheckAllChange = (e) => {
      let number = 0, check_all_data = {}
      if (e.target.checked) {
        number = total
        //!!!!如果选中总数，需要得到所有的数据
        dataSource.forEach(i => {
          check_all_data[i.id] = {...i, checked: true}
        })
      }
      this.setState({
        check_number: number,
        check_data: check_all_data,
        indeterminate: false
      });
    }

    const onCheckChange = (e, record, id) => {
      const number = e.target.checked ? check_number + 1 : check_number - 1
      this.setState({
        indeterminate: !number ? false : number !== total,
        check_number: number,
        check_data: {...check_data, [id]: {...check_data[id], ...record, checked: e.target.checked}}
      });
    }

    const editedJudge = (target) => {
      if (!edited_visible) return false
      if (edited_visible) {
        return target.id === edited_target.id
      }
    }

    if (batch_operation) {
      columns.push({
        title: (<Checkbox indeterminate={indeterminate} checked={check_number === total} onChange={onCheckAllChange}/>),
        dataIndex: 'check_box',
        render: (val, record, index) => {
          const {id} = record
          const checked = check_data[id] ? check_data[id].checked : false
          return <Checkbox onChange={(e) => onCheckChange(e, record, id)} checked={checked}/>
        }
      })
    }


    const onChangeSetData = (value, type) => {
      this.setState({
        edited: {...edited, edited_target: {...edited_target, [type]: value}}
      })
    }

    columns.push({
      title: '姓名',
      dataIndex: 'name',
      render: (val, record) => {
        const inputOnChange = (e) => {
          onChangeSetData(e.target.value, 'name')
        }
        return !editedJudge(record) ? val : (
          <Input value={edited_target.name} onChange={inputOnChange}/>
        )
      }
    })
    columns.push({
      title: '学校',
      dataIndex: 'school',
      width:120,
      render: (val, record) => {
        const onChange=(value)=>{
          onChangeSetData(value, 'school')
        }
        return !editedJudge(record) ? school_from_id[val]?school_from_id[val].alias:'' : (
          <Select
            style={{width:120}}
            value={edited_target.school.toString()} onChange={onChange}>{options}</Select>
        )
      }
    })

    columns.push({
      title: '年级',
      dataIndex: 'grade',
      render: (val, record) => {
        const inputOnChange = (e) => {
          if(/^\d+$/.test(e.target.value)||!e.target.value){ //判断整数或空
            onChangeSetData(e.target.value, 'grade')
          }
        }
        return !editedJudge(record) ? val : (
          <Input value={edited_target.grade} onChange={inputOnChange}/>
        )
      }
    })
    columns.push({
      title: '专业',
      dataIndex: 'major',
      render: (val, record) => {
        const inputOnChange = (e) => {
          onChangeSetData(e.target.value, 'major')
        }
        return !editedJudge(record) ? val : (
          <Input value={edited_target.major} onChange={inputOnChange}/>
        )
      }
    })


    columns.push({
      title: '电话号码',
      dataIndex: 'phone',
      render: (val, record) => {
        const inputOnChange = (e) => {
          const phone=e.target.value
          if(phoneCheck(phone)===null){
            this.setState({
              edited: {...edited, edited_target: {...edited_target,
                phone:phone,
                phone_check: true}}
            })
          }else{
            this.setState({
              edited: {...edited, edited_target: {...edited_target,
                phone:phone,
                phone_check: false}}
            })
          }
        }
        return !editedJudge(record) ? val : (
          <Tooltip title={"请输入正确的手机号"} visible={edited_target.phone_check}>
            <Input value={edited_target.phone} onChange={inputOnChange}/>
          </Tooltip>

        )
      }
    })
    columns.push({
      title: '电子邮箱',
      dataIndex: 'e_mail',
      render: (val, record) => {
        const inputOnChange = (e) => {
          const e_mail=e.target.value
          if(emailCheck(e_mail)===null){
            this.setState({
              edited: {...edited, edited_target: {...edited_target,
                e_mail:e_mail,
                e_mail_check: true}}
            })
          }else{
            this.setState({
              edited: {...edited, edited_target: {...edited_target,
                e_mail:e_mail,
                e_mail_check: false}}
            })
          }
        }
        return !editedJudge(record) ? val : (
          <Tooltip  title={"请输入正确的邮箱"} visible={edited_target.e_mail_check}>
            <Input value={edited_target.e_mail}  onChange={inputOnChange}/>
          </Tooltip>
        )
      }
    })

    // columns.push({
    //   title: '账号状态',
    //   dataIndex: 'account_status',
    //   render: (val, record) => {
    //     const onChange = (value) => {
    //       onChangeSetData(value ? '通过' : '拒绝', 'account_status')
    //     }
    //     return !editedJudge(record) ? val : (
    //       edited_target.account_status !== '审核中' ? (
    //         <Switch checked={edited_target.account_status === '通过'}
    //                 checkedChildren="通过"
    //                 unCheckedChildren="拒绝"
    //                 onChange={onChange}/>
    //       ) : (
    //         <div>
    //           <Button
    //             style={{marginRight: 5}}
    //             type="primary"
    //             size="small"
    //             onClick={() => {
    //               onChange(true)
    //             }}>通过</Button>
    //           <Button
    //             type="danger"
    //             size="small"
    //             onClick={() => {
    //               onChange(false)
    //             }}>拒绝</Button>
    //         </div>
    //       )
    //
    //     )
    //   }
    // })

    if (!batch_operation) {
      columns.push({
        title: '操作',
        dataIndex: 'operation',
        width: 140,
        render: (val, record) => {

          const check=(cb)=>{
            if (edited_visible) {
              message.warning("请先完善上一条信息")
            } else {
              cb()
            }
          }

          const onClick = () => {
            // message.info("编辑")
            const cb=()=>{
              const value = JSON.parse(JSON.stringify(record))
              this.setState({
                edited: {
                  edited_visible: true,
                  edited_target: value,
                },
                when:true
              })
            }
            check(cb)
          }

         const onReSetClick=()=>{
            const cb=()=>{
              message.success('重置成功')
              this.conservationData({value:[{
                id:record.id,password:"123456"
              }]})
            }
           check(cb)
         }

          const confirm = () => {
            const cb=()=>{
              message.info('删除')
              this.conservationData({value:[{
                id:record.id,is_valid:false
              }]})
            }
            check(cb)

          }

          const onHandleSubmit = () => {
            //message.info('保存数据')
            if(!edited_target.e_mail_check
              &&!edited_target.phone_check
            &&edited_target.school
            &&edited_target.grade
            &&edited_target.major
            &&edited_target.phone
            &&edited_target.e_mail){
              const value={...edited_target,status:edited_target.account_status,
                grade:!edited_target.grade?0:parseInt(edited_target.grade),
                email:edited_target.e_mail,school_id:parseInt(edited_target.school)}
                delete value.password
              this.conservationData({value:[value]})
              this.setState({
                edited: {
                  edited_visible: false,
                  edited_target: {},
                },
                newly_increased:false,
                when:false
              })
            }else{
              message.info('请按照规定填写数据')
            }
          }
          const onCancel = () => {
            message.info("取消保存")
            this.setState({
              edited: {
                edited_visible: false,
                edited_target: {},
              },
              newly_increased:false,
              when:false
            })
          }
          return !editedJudge(record) ? (
            <div style={{fontSize: fontSize}} className="text-operation">
              <span className={"cursor-pointer"} onClick={onClick}>编辑</span>
              <span style={{margin: "0 5px"}} className="text-operation-center">|</span>
              <Popconfirm placement="top" title={reset_text}
                          onConfirm={onReSetClick}
                          okText="确定"
                          cancelText="取消">
              <span className={"cursor-pointer"} >重置密码</span>
              </Popconfirm>
              <span style={{margin: "0 5px"}} className="text-operation-center">|</span>
              <Popconfirm placement="top" title={text}
                          onConfirm={confirm}
                          okText="确定"
                          cancelText="取消">
                <span className={"cursor-pointer"}>删除</span>
              </Popconfirm>
            </div>
          ) : (
            <div style={{fontSize: fontSize}} className="text-operation">
              <span className={"cursor-pointer"} onClick={onHandleSubmit}>保存</span>
              <span style={{margin: "0 5px"}} className="text-operation-center">|</span>

              <span className={"cursor-pointer"} onClick={onCancel}>取消</span>

            </div>
          )
        }
      })
    }


    //页码改变的回调 适用于瀑布流取数
    const onPageChange = (page, pageSize) => {
      this.setState({
        current: page,
        loading: true,
      })
      //获取数据
    }
    return (
      <div style={{marginTop: !batch_operation ? 10 : 0}}>
        <Table dataSource={table_data}
               columns={columns}
               rowKey="id"
          //pagination={false}
               pagination={{
                 total: total,
                 pageSize: pageSize,
                 showQuickJumper: true,
                 showTotal: (total) => `共搜索到${total}条数据`
               }}
        />
        {/*<div style={{display: 'flex',*/}
        {/*flexDirection: 'row',*/}
        {/*justifyContent: 'flex-end',*/}
        {/*marginTop: 20,*/}
        {/*}}>*/}
        {/*<Pagination*/}
        {/*current={current}*/}
        {/*total={total}*/}
        {/*pageSize={pageSize}*/}
        {/*onChange={onPageChange}*/}
        {/*showQuickJumper*/}
        {/*showTotal={(total) => `共搜索到${total}条数据`}*/}
        {/*/>*/}
        {/*</div>*/}
        {/**/}
      </div>
    )
  }


  cardBody = () => {
    const {batch_operation} = this.state
    return (
      <div style={{marginTop: 8}}>
        <Card>
          {this.title()}
          {batch_operation ? this.secondHeadArea() : null}
          {this.tableArea()}
        </Card>
      </div>
    )
  }

  render() {
    const {when} = this.state
    return (
      <div>
        {this.cardBody()}
        {/*<Button onClick={()=>{this.setState({*/}
        {/*when:true*/}
        {/*})}}>点我</Button>*/}
        <Prompt
          when={when}
          message='你确定离开吗？'
        />
      </div>
    )
  }
}

const select = (props) => {
  const {student} = props
  return {student}
}

export default connect(select)(Student)
